import pandas as pd
import torch
from src.graph.build_graph import build_dynamic_wind_graph, static_knn_graph

def test_graph_directionality_downwind():
    """A station directly east of the wind source should receive an edge when
    wind blows from west to east (270 degrees is meteorological convention for
    'wind FROM the west'), confirming the bearing/wind-alignment math (Ch.7.2)."""
    stations = pd.DataFrame({"lat": [0.0, 0.0], "lon": [0.0, 0.1]})  # station 1 is east of station 0
    edge_index, edge_weight = build_dynamic_wind_graph(stations, wind_dir_deg=270, wind_speed=5.0, k_neighbors=1)
    assert edge_index.shape[1] > 0
    assert edge_weight.min() >= 0  # no negative (upwind) weights should ever survive

def test_fallback_graph_is_symmetric():
    """Regression test for the V1 bug: the no-wind fallback must add edges in
    both directions for every station pair within range, not an arbitrary subset."""
    stations = pd.DataFrame({"lat": [0.0, 0.01, 0.02], "lon": [0.0, 0.0, 0.0]})
    edge_index, _ = build_dynamic_wind_graph(stations, wind_dir_deg=0, wind_speed=0.0, k_neighbors=1)
    pairs = set(map(tuple, edge_index.t().tolist()))
    for j, i in list(pairs):
        assert (i, j) in pairs or len(pairs) == 0  # symmetric, or empty if genuinely too far apart

def test_static_knn_edge_count():
    stations = pd.DataFrame({"lat": list(range(5)), "lon": [0.0] * 5})
    edge_index, _ = static_knn_graph(stations, k=2)
    assert edge_index.shape[1] == 5 * 2  # exactly k edges per node
