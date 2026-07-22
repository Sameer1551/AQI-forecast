import numpy as np
from scipy import stats

def diebold_mariano_test(errors_model1: np.ndarray, errors_model2: np.ndarray, h: int = 1, power: int = 2):
    """Tests whether model1's forecast errors are significantly different from
    model2's, accounting for forecast-error autocorrelation at horizon h (the
    Harvey-Leybourne-Newbold small-sample correction is applied for h>1)."""
    d = np.abs(errors_model1) ** power - np.abs(errors_model2) ** power
    n = len(d)
    d_mean = d.mean()

    if h == 1:
        d_var = d.var(ddof=1) / n
    else:
        gamma0 = np.var(d, ddof=0)
        gamma = [np.cov(d[:-k], d[k:])[0, 1] for k in range(1, h)]
        d_var = (gamma0 + 2 * sum(gamma)) / n

    dm_stat = d_mean / np.sqrt(d_var)
    hln_correction = np.sqrt((n + 1 - 2 * h + h * (h - 1) / n) / n)
    dm_stat_corrected = dm_stat * hln_correction
    p_value = 2 * (1 - stats.t.cdf(np.abs(dm_stat_corrected), df=n - 1))
    return dm_stat_corrected, p_value


def wilcoxon_signed_rank(errors_model1: np.ndarray, errors_model2: np.ndarray):
    """Non-parametric alternative to Diebold-Mariano — use when forecast errors
    are strongly non-Gaussian (common for pollutant concentrations, which are
    right-skewed); report both tests when in doubt, since agreement between a
    parametric and non-parametric test is itself reassuring evidence."""
    stat, p_value = stats.wilcoxon(np.abs(errors_model1), np.abs(errors_model2))
    return stat, p_value


def paired_bootstrap_ci(errors_model1: np.ndarray, errors_model2: np.ndarray,
                          metric_fn=lambda e: np.sqrt(np.mean(e ** 2)), n_boot: int = 2000, ci: float = 0.95):
    """Bootstrap confidence interval on the metric DIFFERENCE — complements the
    p-value from DM/Wilcoxon with an effect-size estimate, since a significant
    but tiny difference and a significant, practically meaningful difference
    look identical in a p-value alone."""
    n = len(errors_model1)
    diffs = []
    rng = np.random.default_rng(42)
    for _ in range(n_boot):
        idx = rng.integers(0, n, n)
        diffs.append(metric_fn(errors_model1[idx]) - metric_fn(errors_model2[idx]))
    lo, hi = np.percentile(diffs, [(1 - ci) / 2 * 100, (1 + ci) / 2 * 100])
    return float(np.mean(diffs)), float(lo), float(hi)
