import cv2
import time
import httpx  # Sử dụng httpx thay cho requests để tránh block luồng
import numpy as np
from ultralytics import YOLO
from core.config import settings

class PPEDetectionService:
    def __init__(self, camera_id: int = 1):
        self.camera_id = camera_id
        self.model = YOLO(settings.MODEL_PATH)
        
        self.CLASS_HARDHAT = 0
        self.CLASS_MASK = 1
        self.CLASS_NO_HARDHAT = 2
        self.CLASS_NO_MASK = 3
        self.CLASS_NO_SAFETY_REST = 4
        self.CLASS_PERSON = 5
        self.CLASS_SAFETY_VEST = 6
        
        self.start_times = {}
        self.last_sent_times = {}
        # Khởi tạo một httpx client dùng chung để tối ưu hiệu năng kết nối
        self.async_client = httpx.Client()

    def process_binary_frame(self, bytes_data: bytes):
        nparr = np.frombuffer(bytes_data, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    def detect_and_track(self, frame) -> tuple:
        # Sử dụng .track() có persist=True để YOLO tự định danh ID chính xác cho từng người qua các frame
        results = self.model.track(frame, conf=0.4, persist=True, verbose=False)[0]
        persons, violation_boxes, frontend_boxes = [], [], []
        
        for box in results.boxes:
            cls_id = int(box.cls[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            
            # Lấy track_id của vật thể nếu có (YOLO gán khi bật .track())
            track_id = int(box.id[0].item()) if box.id is not None else None
            
            frontend_boxes.append({
                "class_id": cls_id, 
                "bbox": [x1, y1, x2, y2], 
                "confidence": conf,
                "track_id": track_id
            })
            
            if cls_id == self.CLASS_PERSON and track_id is not None:
                persons.append({"track_id": track_id, "bbox": [x1, y1, x2, y2]})
            elif cls_id in [self.CLASS_NO_HARDHAT, self.CLASS_NO_MASK, self.CLASS_NO_SAFETY_REST]:
                violation_boxes.append({"class_id": cls_id, "bbox": [x1, y1, x2, y2]})

        current_frame_violations = []

        # Đối chiếu vi phạm dựa trên định danh chuẩn TRACK_ID của YOLO
        for person in persons:
            p_id = person["track_id"]
            px1, py1, px2, py2 = person["bbox"]
            
            for v_box in violation_boxes:
                vx1, vy1, vx2, vy2 = v_box["bbox"]
                v_center_x, v_center_y = (vx1 + vx2) / 2, (vy1 + vy2) / 2
                
                if (px1 <= v_center_x <= px2) and (py1 <= v_center_y <= py2):
                    if v_box["class_id"] == self.CLASS_NO_HARDHAT:
                        current_frame_violations.append(f"TRACK_{p_id}_NO_HARDHAT")
                    elif v_box["class_id"] == self.CLASS_NO_MASK:
                        current_frame_violations.append(f"TRACK_{p_id}_NO_MASK")
                    elif v_box["class_id"] == self.CLASS_NO_SAFETY_REST:
                        current_frame_violations.append(f"TRACK_{p_id}_NO_SAFETY_VEST")

        now = time.time()
        has_active_danger = False

        for v_type in current_frame_violations:
            if v_type not in self.start_times:
                self.start_times[v_type] = now
            
            elapsed = now - self.start_times[v_type]
            if elapsed >= settings.VIOLATION_THRESHOLD_SECONDS:
                has_active_danger = True
                self._check_cooldown_and_report(v_type, elapsed, now)

        v_types_to_reset = [v for v in self.start_times if v not in current_frame_violations]
        for v in v_types_to_reset:
            del self.start_times[v]
            if v in self.last_sent_times:
                del self.last_sent_times[v]

        return ("Danger" if has_active_danger else "Safe"), current_frame_violations, frontend_boxes

    def _check_cooldown_and_report(self, violation_type: str, duration: float, current_timestamp: float):
        last_sent = self.last_sent_times.get(violation_type)
        if last_sent is None or (current_timestamp - last_sent) >= settings.COOLDOWN_DUPLICATE_SECONDS:
            self.last_sent_times[violation_type] = current_timestamp
            clean_type = "_".join(violation_type.split("_")[2:])
            self._send_to_backend(clean_type, int(duration))

    def _send_to_backend(self, violation_type: str, duration_seconds: int):
        payload = {"cameraId": self.camera_id, "violationType": violation_type, "durationSeconds": duration_seconds}
        try:
            # Dùng client đồng bộ nhưng thiết lập timeout cực ngắn, hoặc có thể tích hợp kịch bản đẩy qua queue nếu cần.
            # Tạm thời dùng httpx để tối ưu hóa pool kết nối, tránh nghẽn luồng socket chính.
            self.async_client.post(settings.SPRING_BOOT_API_URL, json=payload, timeout=0.1)
        except Exception:
            pass