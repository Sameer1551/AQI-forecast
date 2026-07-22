"""
iTransformer wrapper for the AQI multi-station setting.
Paper: Liu et al. (2024), "iTransformer: Inverted Transformers Are Effective for Time Series Forecasting"
"""
import torch
import torch.nn as nn


class ITransformerWrapper(nn.Module):
    """
    Applies self-attention across variate (feature) tokens rather than time tokens.
    Each of the n_features input channels is a token; the Transformer learns cross-variate
    dependencies. For the multi-station setting, run one iTransformer per station
    (channel-independent across stations), then average predictions.

    Key contrast with MAADG: iTransformer captures cross-variable (cross-pollutant,
    cross-meteorological) dependencies but no spatial (cross-station) dependencies.
    Comparing MAADG vs. iTransformer isolates the value of spatial graph modeling.
    """

    def __init__(self, n_features: int, seq_len: int = 48,
                 horizons: tuple = (1, 6, 24, 168), d_model: int = 64,
                 n_heads: int = 4, n_layers: int = 2, dropout: float = 0.1,
                 n_pollutants: int = 6):
        super().__init__()
        self.horizons = horizons
        self.n_pollutants = n_pollutants

        # Project each variate's L-length history to d_model (variate token)
        self.variate_proj = nn.Linear(seq_len, d_model)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=n_heads, dim_feedforward=d_model * 4,
            dropout=dropout, batch_first=True, norm_first=True,
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)
        # Project back to forecast horizons × pollutants
        self.head = nn.Linear(d_model, n_pollutants * len(horizons))

    def forward(self, x):
        # x: [N_stations, seq_len, n_features]
        B, L, F = x.shape
        # Transpose: treat each feature as a token with embedding = its time history
        xT = x.permute(0, 2, 1)               # [B, F, L]
        variate_tokens = self.variate_proj(xT) # [B, F, d_model]
        h = self.encoder(variate_tokens)       # [B, F, d_model] — cross-variate attention
        # Pool across variate dimension to get a station-level embedding
        h_pooled = h.mean(dim=1)              # [B, d_model]
        out = self.head(h_pooled).reshape(B, self.n_pollutants, len(self.horizons))
        return out
