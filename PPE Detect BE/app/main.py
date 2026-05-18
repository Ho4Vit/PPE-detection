import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor

# Import các công cụ đã viết ở các file khác
from .detector import PPEDetector
from .image_processing import ImageProcessor
from .utils import base64_to_cv2, save_violation_to_excel

app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo các thành phần hệ thống
detector = PPEDetector("models/best.pt")
img_processor = ImageProcessor(target_size=(640, 640))
executor = ThreadPoolExecutor(max_workers=4)

@app.websocket("/ws/detect")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    loop = asyncio.get_event_loop()
    
    # Biến cờ để tránh ghi file Excel trùng lặp liên tục trong cùng một đợt vi phạm
    has_logged_this_violation = False
    
    try:
        while True:
            # 1. Nhận dữ liệu Base64 từ React
            data = await websocket.receive_text()
            
            # 2. Giải mã ảnh sang OpenCV định dạng chuẩn (sử dụng utils.py)
            raw_frame = base64_to_cv2(data)
            
            if raw_frame is not None:
                # 3. Tiền xử lý ảnh (Resize, chuẩn hóa - sử dụng image_processing.py)
                processed_frame = img_processor.preprocess(raw_frame)

                # 4. Chạy nhận diện (Inference) trên luồng riêng (sử dụng detector.py)
                status, labels = await loop.run_in_executor(
                    executor, detector.detect, processed_frame
                )

                # 5. Logic ghi file Excel khi vi phạm (sử dụng utils.py)
                # Chỉ ghi vào Excel khi đạt ngưỡng Unsafe (>5s) và chưa được ghi cho đợt này
                if status == "Unsafe":
                    if not has_logged_this_violation:
                        # Chạy ghi file bất đồng bộ để không làm chậm luồng nhận diện
                        loop.run_in_executor(None, save_violation_to_excel, status, labels)
                        has_logged_this_violation = True
                else:
                    # Nếu trạng thái không còn là Unsafe, reset cờ để sẵn sàng cho lần vi phạm sau
                    has_logged_this_violation = False

                # 6. Gửi trả kết quả về cho React hiển thị
                await websocket.send_json({
                    "status": status,
                    "detected": labels
                })
                
    except WebSocketDisconnect:
        # Reset trạng thái khi người dùng ngắt kết nối
        detector.violation_start_time = None
        has_logged_this_violation = False
        print("Client disconnected")
    except Exception as e:
        print(f"Error in websocket loop: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)