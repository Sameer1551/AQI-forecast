from mapie.regression import MapieRegressor

def fit_conformal_baseline(fitted_estimator, X_calib, y_calib, X_test, alpha=0.10):
    mapie = MapieRegressor(estimator=fitted_estimator, method="plus", cv="prefit")
    mapie.fit(X_calib, y_calib)
    y_pred, y_intervals = mapie.predict(X_test, alpha=alpha)
    return y_pred, y_intervals[:, 0, 0], y_intervals[:, 1, 0]  # point, lower, upper
