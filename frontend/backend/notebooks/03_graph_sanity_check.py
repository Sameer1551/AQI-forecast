import folium

def plot_graph(stations_df, edge_index, edge_weight, center=None):
    center = center or [stations_df.lat.mean(), stations_df.lon.mean()]
    m = folium.Map(location=center, zoom_start=6)
    for _, row in stations_df.iterrows():
        folium.CircleMarker([row.lat, row.lon], radius=5, popup=row["name"], color="blue").add_to(m)
    ei, ew = edge_index.numpy(), edge_weight.numpy()
    w_norm = (ew - ew.min()) / (ew.max() - ew.min() + 1e-9)
    for k in range(ei.shape[1]):
        j, i = ei[0, k], ei[1, k]
        p1 = stations_df.iloc[j][["lat", "lon"]].tolist()
        p2 = stations_df.iloc[i][["lat", "lon"]].tolist()
        folium.PolyLine([p1, p2], weight=1 + 4 * w_norm[k], color="red", opacity=0.6,
                         tooltip=f"j={j} -> i={i}, w={ew[k]:.3f}").add_to(m)
    return m
