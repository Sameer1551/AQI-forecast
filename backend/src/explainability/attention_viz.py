import torch

def extract_attention_weights(gat_layer, x, edge_index, edge_weight):
    """Re-runs a GATv2Conv layer with return_attention_weights=True to extract
    per-edge attention coefficients for visualization (e.g., overlaid on the
    Folium graph plot from Ch.7.3, edge thickness = learned attention weight
    rather than the raw wind-transport prior — the difference between the two
    is itself an interesting figure: where does the network override the physical prior?)."""
    edge_attr = edge_weight.unsqueeze(-1) if edge_weight is not None else None
    _, (att_edge_index, att_weights) = gat_layer(
        x, edge_index, edge_attr=edge_attr, return_attention_weights=True
    )
    return att_edge_index, att_weights.mean(dim=1)  # average across attention heads
