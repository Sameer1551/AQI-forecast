import shap

def explain_baseline_with_shap(model, X_background, X_test, feature_names, model_type="tree"):
    """For the Ch.8 baselines (XGBoost/LightGBM/RF): fast, exact TreeExplainer."""
    if model_type == "tree":
        explainer = shap.TreeExplainer(model)
    else:
        explainer = shap.KernelExplainer(model.predict, X_background)
    shap_values = explainer.shap_values(X_test)
    shap.summary_plot(shap_values, X_test, feature_names=feature_names, show=False)
    return shap_values
