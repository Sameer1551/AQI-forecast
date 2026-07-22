import numpy as np
from river.drift import ADWIN
from scipy.stats import ks_2samp

class DriftMonitor:
    """Ensemble drift monitor: quorum-based trigger across error, feature, and
    target-distribution drift. Upgrade over V1's single-ADWIN approach — a single
    detector on error alone misses feature drift that hasn't yet degraded accuracy
    (an early-warning signal a single-signal system would only catch after the fact)."""

    def __init__(self, psi_threshold: float = 0.2, ks_alpha: float = 0.01, quorum: int = 2):
        self.adwin = ADWIN()
        self.psi_threshold = psi_threshold
        self.ks_alpha = ks_alpha
        self.quorum = quorum
        self.drift_log = []

    def update(self, timestamp, prediction_error: float, feature_ref: np.ndarray,
               feature_cur: np.ndarray, target_ref: np.ndarray, target_cur: np.ndarray) -> dict:
        self.adwin.update(prediction_error)
        adwin_flag = self.adwin.drift_detected

        psi = self.population_stability_index(feature_ref, feature_cur)
        psi_flag = psi > self.psi_threshold

        ks_stat, ks_p = ks_2samp(target_ref, target_cur)
        ks_flag = ks_p < self.ks_alpha

        votes = sum([adwin_flag, psi_flag, ks_flag])
        drift_detected = votes >= self.quorum

        result = {"timestamp": timestamp, "adwin": adwin_flag, "psi": psi, "psi_flag": psi_flag,
                  "ks_p": ks_p, "ks_flag": ks_flag, "votes": votes, "drift_detected": drift_detected}
        if drift_detected:
            self.drift_log.append(result)
        return result

    @staticmethod
    def population_stability_index(ref: np.ndarray, cur: np.ndarray, bins: int = 10) -> float:
        """Standard PSI formula, bucketed on the reference distribution's quantiles.
        PSI < 0.1: no significant shift. 0.1-0.2: moderate. >0.2: significant —
        the 0.2 threshold used above is the conventional industry rule of thumb."""
        breakpoints = np.quantile(ref, np.linspace(0, 1, bins + 1))
        breakpoints[0], breakpoints[-1] = -np.inf, np.inf
        ref_pct = np.histogram(ref, bins=breakpoints)[0] / len(ref) + 1e-6
        cur_pct = np.histogram(cur, bins=breakpoints)[0] / len(cur) + 1e-6
        return float(np.sum((cur_pct - ref_pct) * np.log(cur_pct / ref_pct)))
