import torch
from captum.attr import IntegratedGradients

def explain_core_model(model, x_temporal, edge_index, edge_weight, relation_type, n_stations,
                        target_pollutant_idx: int, target_horizon_idx: int, target_quantile_idx: int = 2):
    """Attributes the core model's median-quantile forecast for one (pollutant, horizon)
    back to the input feature window, per station, using Integrated Gradients — a
    theoretically grounded attribution method (satisfies sensitivity and implementation
    invariance axioms) that works directly on the model's forward pass without needing
    a model-specific approximation the way KernelSHAP would."""

    def forward_wrapper(x):
        out, _ = model(x, edge_index, edge_weight, relation_type, n_stations)
        return out[:, target_pollutant_idx, target_horizon_idx, target_quantile_idx]

    ig = IntegratedGradients(forward_wrapper)
    baseline = torch.zeros_like(x_temporal)  # zero baseline; consider a historical-mean
                                              # baseline for features where zero is not
                                              # a meaningful "absence" value (e.g., pressure)
    attributions, delta = ig.attribute(x_temporal, baseline, return_convergence_delta=True)
    return attributions, delta  # delta near 0 confirms the attribution's completeness axiom holds
