import time
from ultralytics import YOLO

class PPEDetector:
    def __init__(self, model_path):
        self.model = YOLO(model_path)
        self.violation_start_time = None
        self.required_labels = ["helmet", "shoes"] # Các nhãn bắt buộc phải có

    def detect(self, frame):
        results = self.model.predict(frame, conf=0.5, verbose=False)
        labels = []
        for r in results:
            labels.extend([self.model.names[int(c)] for c in r.boxes.cls])
        
        # Logic kiểm tra vi phạm (Thiếu bất kỳ đồ bảo hộ nào)
        is_violating = any(item not in labels for item in self.required_labels)
        
        status = "Safe"
        if is_violating:
            if self.violation_start_time is None:
                self.violation_start_time = time.time()
            
            elapsed = time.time() - self.violation_start_time
            if elapsed >= 5:
                status = "Unsafe"
            else:
                status = f"Warning ({int(elapsed)}s)"
        else:
            self.violation_start_time = None
            status = "Safe"
            
        return status, labels