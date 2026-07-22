import copy

# Policy scenarios: each is a set of feature transforms representing a "what-if"
SCENARIOS = {
    "vehicle_ban_40pct": {"no2": lambda v: v * 0.6, "co": lambda v: v * 0.6},
    "road_closure_core": {"road_density_active": lambda v: v * 0.7, "is_rush_hour": lambda v: 0},
    "industrial_shutdown": {"no2_industrial_component": lambda v: 0},
    "green_belt": {"land_use_industrial_pct": lambda v: max(0, v - 0.15),
                   "vegetation_pct": lambda v: min(1, v + 0.15)},
    "crop_burning_spike": {"fire_count_50km": lambda v: v + 20, "fire_frp_50km": lambda v: v * 2.0 + 50},
    "rain_event": {"precipitation": lambda v: v + 10.0, "boundary_layer_height": lambda v: v * 0.8},
    "climate_plus2C": {"temperature_2m": lambda v: v + 2.0},
    "covid_lockdown_proxy": {"no2": lambda v: v * 0.5, "co": lambda v: v * 0.55,
                              "is_rush_hour": lambda v: 0},  # approximates observed 2020 mobility drop
}

def apply_scenario(base_input: dict, scenario_name: str) -> dict:
    cf_input = copy.deepcopy(base_input)
    for feature, transform_fn in SCENARIOS[scenario_name].items():
        if feature in cf_input:
            cf_input[feature] = transform_fn(cf_input[feature])
    return cf_input

def simulate_counterfactual(model_predict_fn, base_input: dict, scenario_name: str):
    cf_input = apply_scenario(base_input, scenario_name)
    factual_pred = model_predict_fn(base_input)
    counterfactual_pred = model_predict_fn(cf_input)
    return {
        "scenario": scenario_name,
        "factual_prediction": factual_pred,
        "counterfactual_prediction": counterfactual_pred,
        "projected_change": counterfactual_pred - factual_pred,
        "projected_pct_change": (counterfactual_pred - factual_pred) / max(factual_pred, 1e-6) * 100,
    }
