from fastapi import APIRouter
v2_router = APIRouter(prefix="/v2")
# @v2_router.post("/predict") ... mount alongside a frozen /v1 router if a breaking change is needed
