import cv2
import numpy as np

class ImageProcessor:
    def __init__(self, target_size=(640, 640)):
        self.target_size = target_size

    def preprocess(self, frame):
        """Các bước xử lý ảnh trước khi đưa vào YOLO"""
        if frame is None:
            return None

        # 1. Resize ảnh về kích thước mà YOLO đã được train (ví dụ 640x640)
        # Việc này giúp đồng nhất tốc độ xử lý (Inference Time)
        frame_resized = cv2.resize(frame, self.target_size)

        # 2. Cân bằng trắng hoặc tăng độ tương phản (Tùy chọn)
        # Giúp detect tốt hơn trong môi trường thiếu sáng của nhà xưởng
        # frame_resized = self._enhance_image(frame_resized)

        return frame_resized

    def _enhance_image(self, frame):
        """Hàm bổ trợ để làm rõ ảnh nếu cần"""
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl,a,b))
        return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

    def get_image_info(self, frame):
        """Lấy thông tin cơ bản của ảnh để log dữ liệu"""
        height, width, _ = frame.shape
        return {"width": width, "height": height}