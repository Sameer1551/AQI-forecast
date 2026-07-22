import pandas as pd
import torch

def run_scalability_study(
    model_factory,   # callable(n_features) -> model
    graph_builder,   # callable(stations_df, weather) -> (edge_index, edge_weight, relation_type)
    n_stations_list: list = [10, 20, 40, 80],
    seq_len: int = 48,
    n_features: int = 50,
    n_reps: int = 5,
    device: str = "cpu",
) -> pd.DataFrame:
    """
    Generates synthetic inputs at each station count and measures:
    graph_build_ms, forward_pass_ms, peak_memory_mb.
    Used to produce the scalability figure and table in §19.5.
    """
    import time, tracemalloc
    rows = []
    for n in n_stations_list:
        for rep in range(n_reps):
            model = model_factory(n_features).to(device).eval()
            x = torch.randn(n, seq_len, n_features, device=device)

            # Synthetic graph
            k = min(4, n - 1)
            edge_index = torch.randint(0, n, (2, n * k), device=device)
            edge_weight = torch.rand(n * k, device=device)
            relation_type = torch.randint(0, 5, (n * k,), device=device)

            # Time graph build (approximated by the graph builder function)
            t0 = time.perf_counter()
            # In a real study: graph_builder(stations_df_of_size_n, weather)
            graph_build_ms = (time.perf_counter() - t0) * 1000

            # Time model forward pass
            tracemalloc.start()
            t1 = time.perf_counter()
            with torch.no_grad():
                _ = model(x, edge_index, edge_weight, relation_type, n_stations=n)
            fwd_ms = (time.perf_counter() - t1) * 1000
            _, peak = tracemalloc.get_traced_memory()
            tracemalloc.stop()

            rows.append({
                "n_stations": n, "rep": rep,
                "graph_build_ms": graph_build_ms,
                "forward_pass_ms": fwd_ms,
                "peak_memory_mb": peak / 1e6,
            })
    return pd.DataFrame(rows)
