from fastapi import APIRouter
from api import ppe_stream

api_router = APIRouter()

api_router.include_router(ppe_stream.router, prefix="/ppe", tags=["PPE Streaming"])