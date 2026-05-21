from fastapi import APIRouter
from . import ppe_stream 

api_router = APIRouter()
api_router.include_router(ppe_stream.router, prefix="/ppe", tags=["luong-ai-yolo"])