"""
TimesNet wrapper (simplified) for the AQI multi-horizon setting.
Paper: Wu et al. (2023), "TimesNet: Temporal 2D-Variation Modeling for General Time Series Analysis"
This is a simplified version capturing the core period-decomposition idea.
Full implementation: https://github.com/thuml/TimesNet
"""
import torch
import torch.nn as nn
import torch.fft


class TimesBlock(nn.Module):
    """Core TimesNet block: FFT-based period detection + 2D Conv on reshaped series."""

    def __init__(self, seq_len: int, d_model: int, top_k: int = 3, conv_channels: int = 32):
        super().__init__()
        self.top_k = top_k
        self.seq_len = seq_len
        # 2D inception-style convolution for multi-scale period modeling
        self.conv2d = nn.Sequential(
            nn.Conv2d(d_model, conv_channels, kernel_size=(3, 3), padding=1),
            nn.GELU(),
            nn.Conv2d(conv_channels, d_model, kernel_size=(1, 1)),
        )

    def forward(self, x):
        # x: [B, L, d_model]
        B, L, D = x.shape
        # FFT-based dominant period detection
        xf = torch.fft.rfft(x.permute(0, 2, 1), dim=-1)  # [B, D, L//2+1]
        freq_amp = xf.abs().mean(dim=1)                    # [B, L//2+1]
        top_periods = freq_amp[:, 1:L // 2 + 1].topk(self.top_k, dim=-1).indices + 1  # [B, top_k]

        out = torch.zeros_like(x)
        for i in range(self.top_k):
            period = int(top_periods[:, i].float().mean().item())
            period = max(period, 1)
            T = (L + period - 1) // period  # number of periods (pad if needed)
            x_pad = torch.nn.functional.pad(x, (0, 0, 0, T * period - L))
            x_2d = x_pad.reshape(B, T, period, D).permute(0, 3, 1, 2)  # [B, D, T, period]
            x_2d = self.conv2d(x_2d)                                    # [B, D, T, period]
            x_flat = x_2d.permute(0, 2, 3, 1).reshape(B, T * period, D)[:, :L, :]
            out = out + x_flat / self.top_k
        return out + x  # residual


class TimesNetWrapper(nn.Module):
    def __init__(self, n_features: int, seq_len: int = 48,
                 horizons: tuple = (1, 6, 24, 168), d_model: int = 64,
                 n_layers: int = 2, dropout: float = 0.1, n_pollutants: int = 6):
        super().__init__()
        self.horizons = horizons
        self.n_pollutants = n_pollutants
        self.input_proj = nn.Linear(n_features, d_model)
        self.blocks = nn.ModuleList([
            TimesBlock(seq_len, d_model) for _ in range(n_layers)
        ])
        self.norm = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, n_pollutants * len(horizons))

    def forward(self, x):
        # x: [N_stations, seq_len, n_features]
        h = self.input_proj(x)             # [N, L, d_model]
        for block in self.blocks:
            h = block(h)
        h = self.norm(h[:, -1, :])        # last-timestep pooling
        out = self.head(h).reshape(x.size(0), self.n_pollutants, len(self.horizons))
        return out
