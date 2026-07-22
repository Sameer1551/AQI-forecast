"""
conftest.py — Shared pytest fixtures for both unit and integration tests.
"""
import sys
import os
import pytest
import torch
import pandas as pd
import numpy as np

# Ensure the project root is on the Python path so `from src.xxx import yyy` works.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


@pytest.fixture
def sample_stations_df():
    """5-station grid for graph tests."""
    return pd.DataFrame({
        "lat": [28.6, 28.7, 28.8, 28.65, 28.75],
        "lon": [77.2, 77.2, 77.2, 77.3, 77.3],
        "location_id": [1, 2, 3, 4, 5],
    })


@pytest.fixture
def small_model():
    """Minimal MAADGTransformer for shape/smoke tests — avoids importing heavy deps."""
    from src.models.core.st_graph_attention_transformer import MAADGTransformer
    return MAADGTransformer(
        n_features=10, n_pollutants=6, horizons=(1, 6, 24, 168),
        quantiles=(0.05, 0.25, 0.5, 0.75, 0.95),
        d_model=16, n_heads=2, n_temporal_layers=1, n_gat_layers=1,
        gat_heads=2, seq_len=24, dropout=0.0,
    )


@pytest.fixture
def sample_graph():
    """Minimal edge_index, edge_weight, relation_type tensors."""
    edge_index = torch.tensor([[0, 1, 2, 3], [1, 2, 3, 4]], dtype=torch.long)
    edge_weight = torch.rand(4)
    relation_type = torch.tensor([1, 1, 2, 3], dtype=torch.long)
    return edge_index, edge_weight, relation_type


@pytest.fixture
def sample_hourly_df():
    """48-hour time-indexed DataFrame for temporal feature tests."""
    idx = pd.date_range("2026-01-01", periods=48, freq="1h")
    rng = np.random.default_rng(0)
    return pd.DataFrame({
        "pm25": rng.uniform(10, 150, 48),
        "pm10": rng.uniform(20, 250, 48),
        "no2": rng.uniform(5, 100, 48),
        "wind_speed_10m": rng.uniform(0, 15, 48),
        "wind_direction_10m": rng.uniform(0, 360, 48),
        "temperature_2m": rng.uniform(15, 40, 48),
        "boundary_layer_height": rng.uniform(200, 2000, 48),
    }, index=idx)
