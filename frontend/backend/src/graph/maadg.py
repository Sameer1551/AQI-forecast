from dataclasses import dataclass
import torch
import torch.nn as nn


RELATION_TYPES = {
    "sensor": 0,
    "transport": 1,
    "weather": 2,
    "traffic_emission": 3,
    "land_use": 4,
}


@dataclass
class MAADGOutput:
    edge_index: torch.Tensor      # [2, E]
    edge_weight: torch.Tensor     # [E]
    relation_type: torch.Tensor   # [E], integer relation id
    edge_attr: torch.Tensor       # [E, F_edge], retained for explainability


class EdgeWeightMLP(nn.Module):
    """Learns edge weights from physical, meteorological, and urban-context features.
    The final sigmoid makes weights positive and bounded; relation embeddings let
    the same scorer behave differently for transport vs. land-use vs. traffic layers."""

    def __init__(self, edge_dim: int, n_relations: int, hidden: int = 64):
        super().__init__()
        self.rel_emb = nn.Embedding(n_relations, 8)
        self.net = nn.Sequential(
            nn.Linear(edge_dim + 8, hidden), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(hidden, hidden // 2), nn.ReLU(),
            nn.Linear(hidden // 2, 1),
        )

    def forward(self, edge_attr: torch.Tensor, relation_type: torch.Tensor) -> torch.Tensor:
        rel = self.rel_emb(relation_type)
        score = self.net(torch.cat([edge_attr, rel], dim=-1)).squeeze(-1)
        return torch.sigmoid(score)


def physics_transport_prior(distance_km, wind_alignment, wind_speed, boundary_layer_height, precipitation):
    """Soft prior, not the final edge weight. Low boundary layers trap pollutants;
    rainfall scavenges particulates; downwind alignment and speed increase transport."""
    mixing = 1.0 / (1.0 + boundary_layer_height / 1000.0)
    rain_scavenging = torch.exp(-0.15 * precipitation.clamp(min=0))
    distance_decay = torch.exp(-distance_km / 50.0)
    return wind_alignment.clamp(min=0) * torch.log1p(wind_speed) * mixing * rain_scavenging * distance_decay


def assemble_maadg(candidate_edges, edge_attr_by_layer: dict[str, torch.Tensor],
                   edge_scorer: EdgeWeightMLP) -> MAADGOutput:
    """Builds one concatenated multi-layer graph. candidate_edges[layer] is a
    [2, E_layer] tensor; edge_attr_by_layer[layer] contains aligned edge features."""
    all_edge_index, all_edge_attr, all_relation = [], [], []
    for layer_name, edge_index in candidate_edges.items():
        rel_id = RELATION_TYPES[layer_name]
        edge_attr = edge_attr_by_layer[layer_name]
        relation_type = torch.full((edge_index.size(1),), rel_id, dtype=torch.long, device=edge_index.device)
        all_edge_index.append(edge_index)
        all_edge_attr.append(edge_attr)
        all_relation.append(relation_type)

    edge_index = torch.cat(all_edge_index, dim=1)
    edge_attr = torch.cat(all_edge_attr, dim=0)
    relation_type = torch.cat(all_relation, dim=0)
    learned_weight = edge_scorer(edge_attr, relation_type)

    return MAADGOutput(
        edge_index=edge_index,
        edge_weight=learned_weight,
        relation_type=relation_type,
        edge_attr=edge_attr,
    )
