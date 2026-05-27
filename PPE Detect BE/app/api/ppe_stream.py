import asyncio
import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.detector import YOLODetector
from services.tracker import ViolationTracker

router = APIRouter()
detector = YOLODetector()

def process_binary_frame(bytes_data: bytes):
    nparr = np.frombuffer(bytes_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

@router.websocket("/ws")
async def ppe_detection_websocket(
    websocket: WebSocket, 
    camera_id: int = 1,
    hardhat: int = 1,  # Nhận diện tham số nón từ URL (1: bật quét, 0: bỏ qua)
    vest: int = 1,     # Nhận diện tham số áo từ URL
    mask: int = 0      # Nhận diện tham số khẩu trang từ URL
):
    await websocket.accept()
    tracker = ViolationTracker(camera_id=camera_id, detector_constants=detector)
    
    # Ép dữ liệu integer 0/1 nhận từ Query Parameter thành cấu hình Boolean cho Tracker
    active_rules = {
        "hardhat": True if hardhat == 1 else False,
        "vest": True if vest == 1 else False,
        "mask": True if mask == 1 else False
    }
    
    print(f"[WebSocket] Thiết lập camera {camera_id} với quy tắc giám sát hoạt động: {active_rules}")
    frame_queue = asyncio.Queue(maxsize=1)

    async def receive_frames():
        try:
            while True:
                bytes_data = await websocket.receive_bytes()
                frame = process_binary_frame(bytes_data)
                if frame is not None:
                    if frame_queue.full():
                        try:
                            frame_queue.get_nowait()
                        except asyncio.QueueEmpty:
                            pass
                    await frame_queue.put(frame)
        except WebSocketDisconnect:
            pass

    async def process_frames():
        try:
            while True:
                frame = await frame_queue.get()
                
                # Gọi luồng xử lý AI nhận diện vật thể
                boxes = await asyncio.to_thread(detector.run_inference, frame)
                
                # Truyền active_rules nhận được từ giao diện React vào hàm phân tích logic vi phạm
                status, violations = tracker.analyze_violations(
                    boxes=boxes, 
                    current_frame=frame, 
                    active_rules=active_rules
                )
                
                # Trả kết quả JSON đồng bộ trạng thái về giao diện người dùng
                await websocket.send_json({
                    "status": status,
                    "current_violations": violations,
                    "boxes": boxes
                })
        except Exception as e:
            print(f"[AI Process Error] Lỗi xử lý khung hình stream: {e}")

    # Chạy song song tiến trình nhận ảnh và xử lý AI bất đồng bộ
    asyncio.create_task(receive_frames())
    await process_frames()