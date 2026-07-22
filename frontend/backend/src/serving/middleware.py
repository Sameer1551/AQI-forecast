import time
import logging
from fastapi import Request

logger = logging.getLogger("serving.requests")

async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000
    logger.info("request", extra={"extra_fields": {
        "path": request.url.path, "method": request.method,
        "status_code": response.status_code, "duration_ms": round(duration_ms, 2),
    }})
    return response

# Register with: app.middleware("http")(log_requests)
