import asyncio
import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# Khởi tạo dịch vụ nhận diện từ project
from services.detector import YOLODetector
from services.tracker import ViolationTracker
detector = YOLODetector()

def process_binary_frame(bytes_data: bytes):
    nparr = np.frombuffer(bytes_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

@router.websocket("/ws/ppe/ws")
async def ppe_detection_websocket(
    websocket: WebSocket, 
    camera_id: int = 1,
    hardhat: int = 1,  
    vest: int = 1,     
    mask: int = 0      
):
    # Chấp nhận bắt tay kết nối
    await websocket.accept()
    
    tracker = ViolationTracker(camera_id=camera_id, detector_constants=detector)
    
    # Ép kiểu dữ liệu cấu hình quy tắc giám sát từ URL params
    active_rules = {
        "hardhat": True if hardhat == 1 else False,
        "vest": True if vest == 1 else False,
        "mask": True if mask == 1 else False
    }
    
    print(f"[WS CONNECTED] Đã kết nối Camera ID: {camera_id} | Rules: {active_rules}")
    
    # Khởi tạo Hàng đợi chứa tối đa 1 frame mới nhất (Chống tràn bộ nhớ khi AI xử lý chậm)
    frame_queue = asyncio.Queue(maxsize=1)

    is_running = True

    async def receive_loop():
        nonlocal is_running
        try:
            while is_running:
                # Nhận bytes thô từ mạng 
                bytes_data = await websocket.receive_bytes()
                frame = process_binary_frame(bytes_data)
                
                if frame is not None:
                    # Nếu AI xử lý không kịp làm queue bị đầy -> Chủ động loại bỏ frame cũ
                    if frame_queue.full():
                        try:
                            frame_queue.get_nowait()
                        except asyncio.QueueEmpty:
                            pass
                    # Đẩy frame mới nhất vừa nhận vào hàng đợi
                    await frame_queue.put(frame)
                    
        except WebSocketDisconnect:
            print(f"[WS DISCONNECTED] Camera ID {camera_id} đã ngắt kết nối.")
        except Exception as e:
            print(f"[WS RECEIVE ERROR] Lỗi luồng nhận frame: {e}")
        finally:
            # Khi luồng nhận dừng (ngắt kết nối), hạ cờ hiệu để kết thúc luôn luồng AI
            is_running = False

    # ================= LUỒNG 2: CHẠY AI VÀ TRẢ KẾT QUẢ =================
    async def process_loop():
        nonlocal is_running
        try:
            while is_running:
                try:
                    # Chờ lấy ảnh từ queue ra (Tối đa 0.2 giây nếu frontend chưa gửi ảnh mới)
                    frame = await asyncio.wait_for(frame_queue.get(), timeout=0.2)
                except asyncio.TimeoutError:
                    continue
                
                # Chuyển hàm run_inference đồng bộ của YOLO sang một thread riêng biệt trong ThreadPool
                # Giúp việc tính toán ma trận nặng của AI không làm nghẽn Event Loop của FastAPI
                boxes = await asyncio.to_thread(detector.run_inference, frame)
                
                # Phân tích luật an toàn lao động (Đếm thời gian vi phạm liên tục > 5s, ghi log Excel local)
                status, violations = tracker.analyze_violations(
                    boxes=boxes, 
                    current_frame=frame, 
                    active_rules=active_rules
                )
                
                # Trả dữ liệu JSON kết quả về trực tiếp cho UI vẽ bounding box
                if is_running:
                    await websocket.send_json({
                        "status": status,
                        "current_violations": violations,
                        "boxes": boxes
                    })
                    
        except Exception as e:
            print(f"[AI PROCESS ERROR] Lỗi luồng xử lý AI: {e}")
        finally:
            is_running = False

    # ÉP BẮT BUỘC: Chạy song song đồng thời cả hai luồng nhận và xử lý
    await asyncio.gather(receive_loop(), process_loop())