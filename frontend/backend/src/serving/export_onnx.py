"""
src/serving/export_onnx.py — ONNX export + mandatory verification gate.

ADR-004: Serving the ONNX-exported model (not PyTorch) reduces the Docker image
from ~3 GB to the low hundreds of MB, a practical requirement for free-tier PaaS.
"""
import torch
import numpy as np


def export_to_onnx(model, dummy_x, dummy_edge_index, dummy_edge_weight,
                   dummy_relation_type, n_stations: int,
                   out_path: str = "models/deployed_model.onnx"):
    """Exports MAADGTransformer to ONNX and immediately verifies the export.
    
    The verification step is mandatory: an export that silently traces incorrectly
    (e.g., a control-flow op that doesn't trace) is worse than no export, since it
    fails silently in production rather than at build time.
    """
    model.eval()
    torch.onnx.export(
        model,
        (dummy_x, dummy_edge_index, dummy_edge_weight, dummy_relation_type, n_stations),
        out_path,
        input_names=["x_temporal", "edge_index", "edge_weight", "relation_type", "n_stations"],
        output_names=["quantile_forecast", "aux_outputs"],
        dynamic_axes={
            "x_temporal": {0: "n_stations"},
            "edge_index": {1: "n_edges"},
            "edge_weight": {0: "n_edges"},
            "relation_type": {0: "n_edges"},
        },
        opset_version=17,
    )
    verify_onnx_matches_pytorch(
        model, out_path, dummy_x, dummy_edge_index, dummy_edge_weight,
        dummy_relation_type, n_stations
    )
    print(f"ONNX model exported and verified: {out_path}")
    return out_path


def verify_onnx_matches_pytorch(torch_model, onnx_path, x, edge_index, edge_weight,
                                  relation_type, n_stations, atol: float = 1e-4):
    """Numerically verifies ONNX output matches PyTorch output.
    
    Raises RuntimeError if outputs diverge beyond tolerance — this is a hard gate
    that must pass before the ONNX artifact can be considered deployable.
    """
    import onnxruntime as ort

    with torch.no_grad():
        torch_out, _ = torch_model(x, edge_index, edge_weight, relation_type, n_stations)
        torch_out_np = torch_out.numpy()

    sess = ort.InferenceSession(onnx_path)
    onnx_out = sess.run(None, {
        "x_temporal": x.numpy(),
        "edge_index": edge_index.numpy().astype(np.int64),
        "edge_weight": edge_weight.numpy(),
        "relation_type": relation_type.numpy().astype(np.int64),
    })[0]

    if not np.allclose(torch_out_np, onnx_out, atol=atol):
        raise RuntimeError(
            f"ONNX export diverges from PyTorch output (max diff: "
            f"{np.abs(torch_out_np - onnx_out).max():.6f}, atol={atol}) — do not deploy."
        )
    print(f"ONNX export verified: outputs match PyTorch within atol={atol}.")


def benchmark_onnx_vs_pytorch(torch_model, onnx_path, x, edge_index, edge_weight,
                               relation_type, n_stations, n_runs: int = 100) -> dict:
    """Reports latency comparison between PyTorch and ONNX inference.
    
    This is the evidence for the 'inference latency' checklist item in §19.6 and §16.5.
    """
    import time
    import onnxruntime as ort

    # PyTorch
    torch_model.eval()
    torch_times = []
    with torch.no_grad():
        for _ in range(n_runs):
            t0 = time.perf_counter()
            torch_model(x, edge_index, edge_weight, relation_type, n_stations)
            torch_times.append((time.perf_counter() - t0) * 1000)

    # ONNX
    sess = ort.InferenceSession(onnx_path)
    inputs = {
        "x_temporal": x.numpy(),
        "edge_index": edge_index.numpy().astype(np.int64),
        "edge_weight": edge_weight.numpy(),
        "relation_type": relation_type.numpy().astype(np.int64),
    }
    onnx_times = []
    for _ in range(n_runs):
        t0 = time.perf_counter()
        sess.run(None, inputs)
        onnx_times.append((time.perf_counter() - t0) * 1000)

    return {
        "pytorch_mean_ms": float(np.mean(torch_times)),
        "pytorch_p95_ms": float(np.percentile(torch_times, 95)),
        "onnx_mean_ms": float(np.mean(onnx_times)),
        "onnx_p95_ms": float(np.percentile(onnx_times, 95)),
        "speedup_factor": float(np.mean(torch_times) / np.mean(onnx_times)),
        "n_runs": n_runs,
    }
