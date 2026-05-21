from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.detect_service import PPEDetectionService

router = APIRouter()

@router.websocket("/ws")
async def ppe_detection_websocket(websocket: WebSocket, camera_id: int = 1):
    await websocket.accept()
    
    # Khởi tạo service AI chuyên biệt xử lý cho kết nối camera này
    ai_service = PPEDetectionService(camera_id=camera_id)
    
    try:
        while True:
            # Tiếp nhận mảng Bytes nhị phân từ Frontend đẩy lên liên tục
            bytes_data = await websocket.receive_bytes()
            frame = ai_service.process_binary_frame(bytes_data)
            
            if frame is None:
                continue
                
            status, violations, boxes = ai_service.detect_and_track(frame)
            
            # Trả ngược kết quả JSON về client ngay lập tức để render bounding box ngoài web
            await websocket.send_json({
                "status": status,
                "current_violations": violations,
                "boxes": boxes
            })
    except WebSocketDisconnect:
        pass