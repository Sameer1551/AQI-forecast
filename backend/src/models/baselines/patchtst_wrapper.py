"""
PatchTST wrapper for the AQI multi-station multi-horizon setting.
Install: pip install patchtst  (or clone from https://github.com/yuqinie98/PatchTST)
Paper: Nie et al. (2023), "A Time Series Is Worth 64 Words: Long-term Forecasting with Transformers"
"""
import torch
import torch.nn as nn


class PatchTSTWrapper(nn.Module):
    """
    Wraps PatchTST for the multi-station AQI setting. Since PatchTST is a
    per-channel (per-variate) model with no spatial component, it receives each
    station's feature window independently and predictions are made per station.
    This is the correct fair-comparison baseline: it tests whether a strong
    temporal-only model can match MAADG without a graph.

    Fair-comparison discipline: same seq_len, same horizons, same feature set,
    same HPO budget as MAADG (Ch.10.2). Do NOT give MAADG more features.
    """

    def __init__(self, n_features: int, seq_len: int = 48,
                 horizons: tuple = (1, 6, 24, 168), patch_len: int = 8,
                 stride: int = 4, d_model: int = 64, n_heads: int = 4,
                 n_layers: int = 2, dropout: float = 0.1, n_pollutants: int = 6):
        super().__init__()
        self.horizons = horizons
        self.n_pollutants = n_pollutants
        n_patches = (seq_len - patch_len) // stride + 1

        # Channel-independent patch embedding
        self.patch_emb = nn.Linear(patch_len, d_model)
        self.pos_enc = nn.Parameter(torch.randn(1, n_patches, d_model) * 0.02)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=n_heads, dim_feedforward=d_model * 4,
            dropout=dropout, batch_first=True, norm_first=True,
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)
        self.head = nn.Linear(d_model * n_patches, n_pollutants * len(horizons))

        self.patch_len = patch_len
        self.stride = stride

    def forward(self, x):
        # x: [N_stations, seq_len, n_features] — treat features as independent channels
        B, L, F = x.shape
        # Extract patches per feature channel (channel-independent PatchTST)
        patches = x.unfold(1, self.patch_len, self.stride)  # [B, n_patches, F, patch_len]
        patches = patches.permute(0, 2, 1, 3).reshape(B * F, -1, self.patch_len)  # [B*F, n_patches, patch_len]
        h = self.patch_emb(patches) + self.pos_enc[:, :patches.size(1), :]
        h = self.encoder(h)  # [B*F, n_patches, d_model]
        h = h.reshape(B, F, -1).mean(dim=1)  # [B, n_patches*d_model] — pool over features
        out = self.head(h).reshape(B, self.n_pollutants, len(self.horizons))
        return out
