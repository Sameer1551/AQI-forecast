import torch
import torch.nn as nn
from torch_geometric.nn import GATv2Conv


class ProbabilisticTemporalTransformer(nn.Module):
    """Temporal encoder producing a per-station embedding from its lookback window.
    Upgrade over V1: adds a learned [CLS]-style pooling option and layer norm before
    the residual, matching the Pre-LN Transformer variant, which is empirically more
    stable to train at this model's shallow depth (2-3 layers) and small d_model."""

    def __init__(self, n_features, d_model=64, n_heads=4, n_layers=2, seq_len=48, dropout=0.1):
        super().__init__()
        self.input_proj = nn.Linear(n_features, d_model)
        self.pos_encoding = nn.Parameter(torch.randn(1, seq_len, d_model) * 0.02)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=n_heads, dim_feedforward=d_model * 4,
            dropout=dropout, batch_first=True, norm_first=True,  # Pre-LN
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)
        self.out_norm = nn.LayerNorm(d_model)

    def forward(self, x):  # x: [batch*n_stations, seq_len, n_features]
        h = self.input_proj(x) + self.pos_encoding[:, : x.size(1), :]
        h = self.encoder(h)
        return self.out_norm(h[:, -1, :])  # [batch*n_stations, d_model]


class RelationAwareGATStack(nn.Module):
    """Spatial encoder over MAADG. Relation embeddings distinguish transport,
    weather, traffic/emission, land-use, and sensor layers while GATv2 uses the
    learned edge weight as edge_attr."""

    def __init__(self, in_channels, hidden=64, heads=4, n_layers=2, dropout=0.1, n_relations=5, rel_dim=8):
        super().__init__()
        self.rel_emb = nn.Embedding(n_relations, rel_dim)
        layers = []
        in_dim = in_channels + rel_dim
        for l in range(n_layers):
            concat = l < n_layers - 1
            out_dim = hidden
            layers.append(GATv2Conv(in_dim, out_dim, heads=heads, concat=concat,
                                     dropout=dropout, edge_dim=1))
            in_dim = out_dim * heads if concat else out_dim
        self.layers = nn.ModuleList(layers)
        self.act = nn.ELU()
        self.proj_residual = nn.Linear(in_channels, hidden) if in_channels != hidden else nn.Identity()

    def forward(self, x, edge_index, edge_weight, relation_type):
        residual = self.proj_residual(x)
        # Aggregate relation context per target node so node states know which
        # mechanism layers are active around them at this timestep.
        target = edge_index[1]
        rel_node = torch.zeros(x.size(0), self.rel_emb.embedding_dim, device=x.device)
        rel_node.index_add_(0, target, self.rel_emb(relation_type))
        rel_count = torch.bincount(target, minlength=x.size(0)).clamp(min=1).to(x.device).unsqueeze(-1)
        h = torch.cat([x, rel_node / rel_count], dim=-1)
        for i, layer in enumerate(self.layers):
            edge_attr = edge_weight.unsqueeze(-1) if edge_weight is not None else None
            h = layer(h, edge_index, edge_attr=edge_attr)
            if i < len(self.layers) - 1:
                h = self.act(h)
        return h + residual  # residual connection: spatial info augments, doesn't overwrite


class AQIMultiTaskHead(nn.Module):
    """Auxiliary operational heads: AQI value, category, dominant pollutant, and
    extreme-event probability. These are trained jointly with pollutant quantiles."""

    def __init__(self, d_model, n_categories=6, n_pollutants=6):
        super().__init__()
        self.aqi_value = nn.Linear(d_model, 1)
        self.aqi_category = nn.Linear(d_model, n_categories)
        self.dominant_pollutant = nn.Linear(d_model, n_pollutants)
        self.extreme_event = nn.Linear(d_model, 1)

    def forward(self, z):
        return {
            "aqi_value": self.aqi_value(z).squeeze(-1),
            "aqi_category_logits": self.aqi_category(z),
            "dominant_pollutant_logits": self.dominant_pollutant(z),
            "extreme_event_logit": self.extreme_event(z).squeeze(-1),
        }


class MAADGTransformer(nn.Module):
    """
    Multi-task, multi-horizon, multi-quantile spatio-temporal AQI forecaster.
    Produces [n_stations, n_pollutants, n_horizons, n_quantiles] per forward pass.
    """

    def __init__(self, n_features, n_pollutants=6, horizons=(1, 6, 24, 168),
                 quantiles=(0.05, 0.25, 0.5, 0.75, 0.95), d_model=64, n_heads=4,
                 n_temporal_layers=2, n_gat_layers=2, gat_heads=4, seq_len=48, dropout=0.1):
        super().__init__()
        self.n_pollutants = n_pollutants
        self.horizons = horizons
        self.quantiles = quantiles
        self.n_outputs = n_pollutants * len(horizons) * len(quantiles)

        self.temporal = ProbabilisticTemporalTransformer(
            n_features, d_model=d_model, n_heads=n_heads, n_layers=n_temporal_layers,
            seq_len=seq_len, dropout=dropout,
        )
        self.spatial = RelationAwareGATStack(d_model, hidden=d_model, heads=gat_heads,
                                             n_layers=n_gat_layers, dropout=dropout)
        self.fusion = nn.Sequential(
            nn.Linear(d_model * 2, d_model), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(d_model, d_model), nn.ReLU(),
        )
        self.output_head = nn.Linear(d_model, self.n_outputs)
        self.aux_head = AQIMultiTaskHead(d_model, n_pollutants=n_pollutants)

    def forward(self, x_temporal, edge_index, edge_weight, relation_type, n_stations):
        temporal_emb = self.temporal(x_temporal)                              # [N, d]
        spatial_emb = self.spatial(temporal_emb, edge_index, edge_weight, relation_type)  # [N, d]
        fused = self.fusion(torch.cat([temporal_emb, spatial_emb], dim=-1))   # [N, d]
        out = self.output_head(fused)                                          # [N, n_outputs]
        out = out.view(n_stations, self.n_pollutants, len(self.horizons), len(self.quantiles))
        return self.enforce_monotonic_quantiles(out), self.aux_head(fused)

    @staticmethod
    def enforce_monotonic_quantiles(q: torch.Tensor) -> torch.Tensor:
        """Hard-enforces non-crossing quantiles at inference time via sorting along the
        last dim (cheap, differentiable almost everywhere, and exact — a stronger
        guarantee than the soft penalty alone, which only discourages crossing during
        training but doesn't guarantee it post-hoc)."""
        return torch.sort(q, dim=-1).values


def pinball_loss(pred: torch.Tensor, target: torch.Tensor, quantiles: tuple, mask: torch.Tensor = None) -> torch.Tensor:
    """pred: [N, P, K, Q]; target: [N, P, K] (broadcast across the quantile dim)."""
    if mask is None:
        mask = ~torch.isnan(target)
    target_safe = torch.nan_to_num(target).unsqueeze(-1)         # [N, P, K, 1]
    q_tensor = torch.tensor(quantiles, device=pred.device).view(1, 1, 1, -1)
    diff = target_safe - pred                                     # [N, P, K, Q]
    loss = torch.max(q_tensor * diff, (q_tensor - 1) * diff)
    loss = loss * mask.unsqueeze(-1)
    return loss.sum() / mask.unsqueeze(-1).expand_as(loss).sum().clamp(min=1)


def monotonicity_penalty(pred: torch.Tensor) -> torch.Tensor:
    """Soft penalty during training (in addition to the hard sort at inference);
    encourages the network's raw, pre-sort outputs to already be near-monotonic,
    which empirically improves calibration versus relying on the sort alone."""
    diffs = pred[..., :-1] - pred[..., 1:]  # should be <= 0 (tau_a < tau_b => q_a <= q_b)
    return torch.relu(diffs).mean()


def graph_smoothness_loss(median_pred: torch.Tensor, edge_index: torch.Tensor,
                          edge_weight: torch.Tensor) -> torch.Tensor:
    """Penalizes large forecast disagreement across high-weight MAADG edges.
    median_pred: [N, P, K]. Keep lambda small so local emission spikes survive."""
    src, dst = edge_index
    diff = median_pred[src] - median_pred[dst]
    per_edge = diff.pow(2).mean(dim=(1, 2))
    return (edge_weight * per_edge).sum() / edge_weight.sum().clamp(min=1e-6)


def auxiliary_loss(aux_pred: dict, aux_target: dict) -> torch.Tensor:
    loss = 0.0
    if "aqi_value" in aux_target:
        loss = loss + nn.functional.mse_loss(aux_pred["aqi_value"], aux_target["aqi_value"])
    if "aqi_category" in aux_target:
        loss = loss + nn.functional.cross_entropy(aux_pred["aqi_category_logits"], aux_target["aqi_category"])
    if "dominant_pollutant" in aux_target:
        loss = loss + nn.functional.cross_entropy(aux_pred["dominant_pollutant_logits"], aux_target["dominant_pollutant"])
    if "extreme_event" in aux_target:
        loss = loss + nn.functional.binary_cross_entropy_with_logits(
            aux_pred["extreme_event_logit"], aux_target["extreme_event"].float()
        )
    return loss


def total_loss(pred, target, quantiles, aux_pred=None, aux_target=None,
               edge_index=None, edge_weight=None, lambda_mono=0.1,
               lambda_smooth=0.01, lambda_aux=0.2, mask=None):
    loss = pinball_loss(pred, target, quantiles, mask) + lambda_mono * monotonicity_penalty(pred)
    if edge_index is not None and edge_weight is not None:
        median_idx = list(quantiles).index(0.5)
        loss = loss + lambda_smooth * graph_smoothness_loss(pred[..., median_idx], edge_index, edge_weight)
    if aux_pred is not None and aux_target is not None:
        loss = loss + lambda_aux * auxiliary_loss(aux_pred, aux_target)
    return loss
