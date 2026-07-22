import pandas as pd
from src.explainability.counterfactual import simulate_counterfactual

def validate_against_lockdown(model_predict_fn, pre_lockdown_data: pd.DataFrame,
                               actual_lockdown_data: pd.DataFrame, city: str) -> dict:
    """
    Protocol:
    1. Take real pre-lockdown (Feb 2020) feature vectors as the 'base_input'.
    2. Get the model's counterfactual prediction under the 'covid_lockdown_proxy'
       scenario (simulating the mobility-driven emission drop).
    3. Compare the *projected* AQI change against the *actually observed* AQI
       change during the real April 2020 lockdown, for the same city/season.
    4. This validates DIRECTION (did the model correctly predict AQI would fall?)
       and rough MAGNITUDE (was the predicted drop in a plausible range of the
       observed drop?) — NOT a causal effect size, since many confounds differ
       between the model's synthetic scenario and the real, multi-causal lockdown
       period (e.g., reduced industrial activity beyond just vehicles, weather
       differences between years).
    """
    base_input = pre_lockdown_data.mean().to_dict()
    cf_result = simulate_counterfactual(model_predict_fn, base_input, "covid_lockdown_proxy")

    actual_pre = pre_lockdown_data["pm25"].mean()
    actual_during = actual_lockdown_data["pm25"].mean()
    actual_pct_change = (actual_during - actual_pre) / actual_pre * 100

    return {
        "city": city,
        "model_projected_pct_change": cf_result["projected_pct_change"],
        "actual_observed_pct_change": actual_pct_change,
        "direction_match": (cf_result["projected_pct_change"] < 0) == (actual_pct_change < 0),
        "magnitude_within_2x": abs(cf_result["projected_pct_change"]) <= 2 * abs(actual_pct_change)
                                and abs(cf_result["projected_pct_change"]) >= 0.5 * abs(actual_pct_change),
    }
