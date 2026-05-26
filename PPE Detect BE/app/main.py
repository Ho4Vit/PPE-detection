import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.api import api_router

app = FastAPI(
    title="PPE Safety Monitoring AI Service",
    description="Hệ thống AI nhận diện trang phục bảo hộ lao động thời gian thực bằng FastAPI & YOLOv8",
    version="1.0.0"
)

# Cấu hình CORS cho phép ReactJS Frontend truy cập không bị chặn
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong thực tế sản xuất bạn nên thay đổi cụ thể thành IP Frontend của bạn
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Nạp toàn bộ cây Router vào ứng dụng gốc với tiền tố /api/v1
app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)