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
async def ppe_detection_websocket(websocket: WebSocket, camera_id: int = 1):
    await websocket.accept()
    tracker = ViolationTracker(camera_id=camera_id, detector_constants=detector)
    
    # Tạo một hàng đợi chứa tối đa 1 frame mới nhất
    frame_queue = asyncio.Queue(maxsize=1)

    # TÁC VỤ 1: Luồng nhận ảnh từ Client (Giải phóng băng thông mạng ngay lập tức)
    async def receive_frames():
        try:
            while True:
                bytes_data = await websocket.receive_bytes()
                frame = process_binary_frame(bytes_data)
                if frame is not None:
                    # Nếu hàng đợi đã đầy (AI chưa xử lý kịp frame cũ), 
                    # tiến hành xóa frame cũ để nạp frame mới nhất vào (Drop Frame cứu trễ)
                    if frame_queue.full():
                        try:
                            frame_queue.get_nowait()
                        except asyncio.QueueEmpty:
                            pass
                    await frame_queue.put(frame)
        except WebSocketDisconnect:
            pass

    # TÁC VỤ 2: Luồng chạy AI và phản hồi kết quả
    async def process_frames():
        try:
            while True:
                # Chờ có frame mới trong Queue
                frame = await frame_queue.get()
                
                # Chạy AI thô độc lập (Chạy trên ThreadPool để không block event loop của FastAPI)
                boxes = await asyncio.to_thread(detector.run_inference, frame)
                
                # Tính toán logic nghiệp vụ vi phạm
                status, violations = tracker.analyze_violations(boxes)
                
                # Trả kết quả JSON về Client
                await websocket.send_json({
                    "status": status,
                    "current_violations": violations,
                    "boxes": boxes
                })
        except Exception as e:
            print(f"Error in processing: {e}")

    # Chạy song song cả 2 luồng bất đồng bộ
    receive_task = asyncio.create_task(receive_frames())
    process_task = asyncio.create_task(process_frames())

    try:
        # Giữ kết nối mở cho đến khi một trong hai tác vụ bị ngắt hoặc Client đóng tab
        await asyncio.gather(receive_task, process_task)
    except WebSocketDisconnect:
        pass
    finally:
        receive_task.cancel()
        process_task.cancel()