import cv2
import os
import time
from ultralytics import YOLO
from image_processor import ImageEnhancer # Import bộ xử lý ảnh

class PPEDetector:
    def __init__(self, model_path):
        self.model_path = model_path
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Không tìm thấy model tại: {self.model_path}")
            
        self.model = YOLO(self.model_path)
        self.class_names = self.model.names 
        self.violation_start_time = None 

    def detect_and_check(self, frame, required_items):
        # === BƯỚC 1: ÁP DỤNG XỬ LÝ ẢNH (CHƯƠNG 2) ===
        # Tiền xử lý để model YOLO "nhìn" rõ hơn, đặc biệt trong môi trường thiếu sáng
        processed_frame = ImageEnhancer.enhance_for_yolo(frame)
        
        # Có thể tùy chọn làm sắc nét thêm nếu camera bị mờ
        # processed_frame = ImageEnhancer.sharpen(processed_frame)

        # Chạy YOLO trên frame đã được xử lý thay vì frame gốc
        results = self.model(processed_frame, stream=True, conf=0.2)
        
        detected_classes = set()
        detected_objects = [] 
        # Chúng ta vẽ lên frame gốc để giữ màu sắc tự nhiên cho người dùng xem
        annotated_frame = frame.copy() 
        
        found_person = False
        is_person_fully_visible = False

        for r in results:
            # Vẽ các bounding box lên frame
            annotated_frame = r.plot() 
            
            if r.boxes:
                for box in r.boxes:
                    c = int(box.cls)
                    name = self.class_names.get(c, "Unknown")
                    detected_classes.add(name)
                    coords = box.xyxy[0].cpu().numpy().astype(int)
                    
                    if name == 'Person':
                        found_person = True
                        if coords[1] > 40: 
                            is_person_fully_visible = True
                    
                    # === BƯỚC 2: HẬU XỬ LÝ ẢNH CẮT (CHƯƠNG 2 & 4) ===
                    # Cắt vật thể và làm đẹp vùng cắt trước khi trả về
                    x1, y1, x2, y2 = coords
                    crop = frame[max(0,y1):y2, max(0,x1):x2]
                    
                    # Nếu là các món đồ bảo hộ, có thể lọc nhiễu riêng cho vùng đó
                    if name in ['Hardhat', 'Mask', 'Safety Vest'] and crop.size > 0:
                        crop = cv2.detailEnhance(crop, sigma_s=10, sigma_r=0.15)
                    
                    detected_objects.append({
                        'name': name, 
                        'box': coords, 
                        'crop': crop # Trả về ảnh đã xử lý chi tiết
                    })

        # --- Logic kiểm tra vi phạm (giữ nguyên của bạn) ---
        violations = [item for item in required_items if item not in detected_classes]
        is_safe = True
        msg = "NO PERSON DETECTED"
        color = (255, 255, 255)

        if found_person:
            if is_person_fully_visible and len(violations) > 0:
                if self.violation_start_time is None:
                    self.violation_start_time = time.time()
                
                elapsed_time = time.time() - self.violation_start_time
                if elapsed_time >= 5: 
                    is_safe = False
                    msg = f"UNSAFE: MISSING {', '.join(violations).upper()}"
                    color = (0, 0, 255)
                else:
                    countdown = int(5 - elapsed_time)
                    msg = f"VERIFYING VIOLATION ({countdown}s)..."
                    color = (0, 255, 255) 
            else:
                self.violation_start_time = None
                is_safe = True
                msg = "STATUS: SAFE" if is_person_fully_visible else "SCANNING..."
                color = (0, 255, 0) if is_person_fully_visible else (255, 255, 0)

        cv2.putText(annotated_frame, msg, (20, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 3)
        
        return annotated_frame, is_safe, violations, detected_objects