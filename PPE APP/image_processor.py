import cv2
import numpy as np

class ImageEnhancer:
    """
    Áp dụng các kỹ thuật từ Chương 2, 3 và 4 để tối ưu hóa chất lượng ảnh
    """
    
    @staticmethod
    def apply_clahe(frame):
        """
        [Chương 2: Toán tử điểm]
        Cân bằng lược đồ xám thích nghi (CLAHE) giúp làm rõ chi tiết trong vùng tối/sáng quá mức.
        Cực kỳ hữu ích khi camera lắp tại công trường có ánh sáng không ổn định.
        """
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        # Giới hạn độ tương phản để tránh nhiễu (clipLimit)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced_img = cv2.merge((l, a, b))
        return cv2.cvtColor(enhanced_img, cv2.COLOR_LAB2BGR)

    @staticmethod
    def reduce_noise(frame):
        """
        [Chương 2: Lọc tuyến tính]
        Sử dụng lọc Gaussian để làm mịn ảnh, loại bỏ nhiễu nhiễu hạt (Gaussian noise) 
        giúp YOLO không bị nhầm lẫn bởi các pixel nhiễu.
        """
        return cv2.GaussianBlur(frame, (3, 3), 0)

    @staticmethod
    def detect_roi_edges(frame):
        """
        [Chương 3: Phát hiện cạnh]
        Sử dụng Canny để tìm biên các vật thể hoặc khu vực giới hạn nguy hiểm.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        return edges

    @staticmethod
    def segment_person_refined(person_crop):
        """
        [Chương 4: Phân đoạn ảnh]
        Sử dụng GrabCut hoặc Thresholding đơn giản để tách người ra khỏi nền
        giúp ảnh 'Person Crop' trông sạch sẽ hơn.
        """
        if person_crop.size == 0: return person_crop
        
        # Tạo mask đơn giản bằng cách lọc nhiễu và nhị phân hóa
        gray = cv2.cvtColor(person_crop, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Áp dụng toán tử hình thái học (Morphological ops) để lấp lỗ trống
        kernel = np.ones((5,5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        return cv2.bitwise_and(person_crop, person_crop, mask=mask)

    @staticmethod
    def sharpen_image(frame):
        """
        [Chương 2: Lọc thông cao]
        Làm sắc nét các cạnh để giúp việc đối sánh đặc trưng (Chương 3) tốt hơn.
        """
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        return cv2.filter2D(frame, -1, kernel)