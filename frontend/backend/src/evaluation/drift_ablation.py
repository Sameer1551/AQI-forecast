import numpy as np

def evaluate_detector_config(monitor_factory, stream_with_known_drift_points, injected_drift_timestamps):
    """Runs a detector config over a stream with known ground-truth drift points
    and reports detection latency (timestamps after the true drift point until
    flagged) and false-positive count (flags with no nearby true drift point)."""
    monitor = monitor_factory()
    detections = []
    for t, error, f_ref, f_cur, t_ref, t_cur in stream_with_known_drift_points:
        result = monitor.update(t, error, f_ref, f_cur, t_ref, t_cur)
        if result["drift_detected"]:
            detections.append(t)

    latencies = []
    for true_t in injected_drift_timestamps:
        later_detections = [d for d in detections if d >= true_t]
        if later_detections:
            latencies.append(later_detections[0] - true_t)
    false_positives = len(detections) - len([d for d in detections
                                              if any(abs(d - t) < 48 for t in injected_drift_timestamps)])
    return {"mean_latency_hours": np.mean(latencies) if latencies else None,
            "false_positives": false_positives, "n_detections": len(detections)}
