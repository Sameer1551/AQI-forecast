import numpy as np
import torch

def _pairwise_bearing_distance(coords: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Vectorized bearing (deg, from j to i) and great-circle distance (km) for all
    pairs. O(N^2) memory, O(N^2) time but with NumPy's C loop, not Python's —
    this is the single biggest wall-clock win over V1's nested-loop version."""
    lat = np.radians(coords[:, 0])
    lon = np.radians(coords[:, 1])
    lat_i, lat_j = lat[:, None], lat[None, :]
    lon_i, lon_j = lon[:, None], lon[None, :]

    d_lon = lon_i - lon_j
    x = np.sin(d_lon) * np.cos(lat_i)
    y = np.cos(lat_j) * np.sin(lat_i) - np.sin(lat_j) * np.cos(lat_i) * np.cos(d_lon)
    bearing_j_to_i = (np.degrees(np.arctan2(x, y)) + 360) % 360  # shape [N, N]

    R = 6371.0
    d_lat = lat_i - lat_j
    a = np.sin(d_lat / 2) ** 2 + np.cos(lat_j) * np.cos(lat_i) * np.sin(d_lon / 2) ** 2
    dist_km = 2 * R * np.arcsin(np.sqrt(np.clip(a, 0, 1)))  # shape [N, N]
    return bearing_j_to_i, dist_km


def build_dynamic_wind_graph(stations_df, wind_dir_deg: float, wind_speed: float,
                              k_neighbors: int = 4) -> tuple[torch.Tensor, torch.Tensor]:
    """
    Directed, weighted graph: edge j->i weighted by how strongly wind transports
    pollution from j to i right now. Recomputed every timestep — this IS the
    "dynamic graph" novelty claim (RQ1/H1); it is the single component this whole
    guide's ablation study exists to justify.

    Complexity: O(N^2) time and memory to build (N = station count); for N<200
    (this project's scale) this is under a millisecond on CPU and negligible next
    to the model forward pass. At national scale (N>1000) this would need to move
    to a sparse, radius-limited computation — noted as a scaling limitation (Ch.22).
    """
    n = len(stations_df)
    coords = stations_df[["lat", "lon"]].values
    bearing, dist_km = _pairwise_bearing_distance(coords)  # both [N, N], [j, i] = j->i

    wind_align = np.cos(np.deg2rad(bearing - wind_dir_deg))
    wind_align = np.clip(wind_align, 0, None)  # ignore upwind stations (no transport)
    weight = wind_align * wind_speed / (1 + dist_km)  # [j, i]: closer + downwind = higher
    np.fill_diagonal(weight, 0)  # no self-loops here; added explicitly by the GAT layer if needed

    edge_index, edge_weight = [], []
    for i in range(n):
        col = weight[:, i]  # weights of all j -> i
        top_j = np.argsort(-col)[:k_neighbors]
        for j in top_j:
            if col[j] > 0:
                edge_index.append([j, i])
                edge_weight.append(col[j])

    if not edge_index:  # fallback: symmetric distance graph (fixes V1's directionality bug)
        for i in range(n):
            for j in range(n):
                if i != j and dist_km[j, i] < 50:
                    edge_index.append([j, i])
                    edge_weight.append(1 / (1 + dist_km[j, i]))

    edge_index_t = torch.tensor(edge_index, dtype=torch.long).t().contiguous()
    edge_weight_t = torch.tensor(edge_weight, dtype=torch.float)
    return edge_index_t, edge_weight_t


def static_knn_graph(stations_df, k: int = 4) -> tuple[torch.Tensor, torch.Tensor]:
    """Ablation baseline for RQ1: symmetric k-nearest-neighbor graph, no wind."""
    n = len(stations_df)
    coords = stations_df[["lat", "lon"]].values
    _, dist_km = _pairwise_bearing_distance(coords)
    edge_index, edge_weight = [], []
    for i in range(n):
        neighbors = np.argsort(dist_km[i])[1 : k + 1]  # skip self at index 0
        for j in neighbors:
            edge_index.append([j, i])
            edge_weight.append(1 / (1 + dist_km[i, j]))
    return (torch.tensor(edge_index, dtype=torch.long).t().contiguous(),
            torch.tensor(edge_weight, dtype=torch.float))
