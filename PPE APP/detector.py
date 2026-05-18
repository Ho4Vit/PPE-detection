import cv2
import os
import time
from ultralytics import YOLO
from image_processor import ImageEnhancer

class PPEDetector:
    def __init__(self, model_path):
        self.model_path = model_path
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model không tồn tại: {self.model_path}")
            
        self.model = YOLO(self.model_path)
        self.class_names = self.model.names 
        self.violation_start_time = None 

    def detect_and_check(self, frame, required_items):
        # Tiền xử lý ảnh tăng độ nét
        processed_frame = ImageEnhancer.enhance_for_yolo(frame)
        
        # Nhận diện vật thể
        results = self.model(processed_frame, stream=True, conf=0.2)
        
        detected_classes = set()
        detected_objects = [] 
        annotated_frame = frame.copy() 
        found_person = False
        is_person_fully_visible = False

        for r in results:
            annotated_frame = r.plot() 
            if r.boxes:
                for box in r.boxes:
                    c = int(box.cls)
                    name = self.class_names.get(c, "Unknown")
                    detected_classes.add(name)
                    coords = box.xyxy[0].cpu().numpy().astype(int)
                    
                    if name == 'Person':
                        found_person = True
                        if coords[1] > 40: is_person_fully_visible = True
                    
                    # Cắt và làm đẹp ảnh đối tượng (không lưu DB)
                    x1, y1, x2, y2 = coords
                    crop = frame[max(0,y1):y2, max(0,x1):x2]
                    if name in ['Hardhat', 'Mask', 'Safety Vest'] and crop.size > 0:
                        crop = cv2.detailEnhance(crop, sigma_s=10, sigma_r=0.15)
                    
                    detected_objects.append({'name': name, 'box': coords, 'crop': crop})

        # Logic kiểm tra lỗi PPE
        violations = [item for item in required_items if item not in detected_classes]
        is_safe, msg, color = True, "NO PERSON", (255, 255, 255)

        if found_person:
            if is_person_fully_visible and len(violations) > 0:
                if self.violation_start_time is None: self.violation_start_time = time.time()
                elapsed = time.time() - self.violation_start_time
                if elapsed >= 5: 
                    is_safe, msg, color = False, f"UNSAFE: MISSING {', '.join(violations).upper()}", (0, 0, 255)
                else:
                    msg, color = f"VERIFYING ({int(5-elapsed)}s)...", (0, 255, 255)
            else:
                self.violation_start_time = None
                msg, color = ("STATUS: SAFE", (0, 255, 0)) if is_person_fully_visible else ("SCANNING...", (255, 255, 0))

        cv2.putText(annotated_frame, msg, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 3)
        return annotated_frame, is_safe, violations, detected_objects