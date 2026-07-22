import torch

def audit_graph_structure(edge_weight: torch.Tensor, edge_index: torch.Tensor,
                           n_stations: int) -> dict:
    """Diagnostic statistics on the built graph at a given timestep — low weight
    variance and low degree heterogeneity are early signals of graph collapse."""
    degree = torch.bincount(edge_index[1], minlength=n_stations).float()
    return {
        "edge_weight_mean": float(edge_weight.mean()),
        "edge_weight_std": float(edge_weight.std()),
        "edge_weight_max": float(edge_weight.max()),
        "edge_weight_min": float(edge_weight.min()),
        "degree_mean": float(degree.mean()),
        "degree_std": float(degree.std()),
        "is_near_uniform": bool(edge_weight.std() < 0.05),  # flag for logging
    }
