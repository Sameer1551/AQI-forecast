import torch
import time
import tracemalloc

def benchmark_inference(model, x, edge_index, edge_weight, relation_type, n_stations,
                          n_warmup: int = 10, n_runs: int = 100) -> dict:
    """
    Reports: mean inference latency (ms), std, peak GPU/CPU memory (MB).
    Run separately for PyTorch and ONNX (Ch.16.1) and report both.
    """
    device = next(model.parameters()).device

    # Warmup
    with torch.no_grad():
        for _ in range(n_warmup):
            _ = model(x, edge_index, edge_weight, relation_type, n_stations)

    # Benchmark
    if device.type == "cuda":
        torch.cuda.synchronize()
        starter = torch.cuda.Event(enable_timing=True)
        ender = torch.cuda.Event(enable_timing=True)
        timings = []
        with torch.no_grad():
            for _ in range(n_runs):
                starter.record()
                _ = model(x, edge_index, edge_weight, relation_type, n_stations)
                ender.record()
                torch.cuda.synchronize()
                timings.append(starter.elapsed_time(ender))
        peak_mem_mb = torch.cuda.max_memory_allocated(device) / 1e6
    else:
        timings = []
        tracemalloc.start()
        with torch.no_grad():
            for _ in range(n_runs):
                t0 = time.perf_counter()
                _ = model(x, edge_index, edge_weight, relation_type, n_stations)
                timings.append((time.perf_counter() - t0) * 1000)
        _, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        peak_mem_mb = peak / 1e6

    return {
        "mean_latency_ms": float(torch.tensor(timings).mean()),
        "std_latency_ms": float(torch.tensor(timings).std()),
        "p95_latency_ms": float(torch.tensor(timings).quantile(0.95)),
        "peak_memory_mb": peak_mem_mb,
        "n_runs": n_runs,
        "device": str(device),
    }
