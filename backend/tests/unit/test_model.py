import torch
from src.models.core.st_graph_attention_transformer import MAADGTransformer, pinball_loss

def test_output_shape():
    model = MAADGTransformer(n_features=10, n_pollutants=6, horizons=(1, 6, 24, 168),
                             quantiles=(0.05, 0.25, 0.5, 0.75, 0.95), d_model=16, n_heads=2,
                             n_temporal_layers=1, n_gat_layers=1, gat_heads=2, seq_len=24)
    n_stations = 5
    x = torch.randn(n_stations, 24, 10)
    edge_index = torch.tensor([[0, 1, 2], [1, 2, 3]])
    edge_weight = torch.rand(3)
    relation_type = torch.tensor([1, 1, 3])
    out, aux = model(x, edge_index, edge_weight, relation_type, n_stations=n_stations)
    assert out.shape == (5, 6, 4, 5)
    assert aux["aqi_value"].shape == (5,)

def test_quantiles_are_monotonic_after_forward():
    model = MAADGTransformer(n_features=10, d_model=16, n_heads=2, n_temporal_layers=1,
                             n_gat_layers=1, gat_heads=2, seq_len=24)
    x = torch.randn(4, 24, 10)
    edge_index = torch.tensor([[0, 1], [1, 2]])
    edge_weight = torch.rand(2)
    relation_type = torch.tensor([1, 2])
    out, _ = model(x, edge_index, edge_weight, relation_type, n_stations=4)
    assert (out.diff(dim=-1) >= 0).all(), "Quantiles must be non-decreasing after enforce_monotonic_quantiles"

def test_pinball_loss_zero_at_perfect_prediction():
    quantiles = (0.05, 0.5, 0.95)
    target = torch.full((2, 1, 1), 10.0)
    pred = torch.full((2, 1, 1, 3), 10.0)
    loss = pinball_loss(pred, target, quantiles)
    assert torch.isclose(loss, torch.tensor(0.0), atol=1e-6)
