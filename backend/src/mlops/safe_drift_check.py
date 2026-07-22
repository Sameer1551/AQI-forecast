import logging
logger = logging.getLogger("mlops.drift")

def safe_drift_update(monitor, **kwargs) -> dict:
    try:
        return monitor.update(**kwargs)
    except Exception:
        logger.exception("Drift monitor update failed — defaulting to no-drift (fail-safe)")
        return {"drift_detected": False, "error": True}
