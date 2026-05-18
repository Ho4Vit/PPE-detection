import cv2
import os
import time
import threading
import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
from ultralytics import YOLO
from datetime import datetime
import openpyxl
from openpyxl.drawing.image import Image as OpenpyxlImage
import io

# Import class từ file image_processor.py
from image_processor import ImageEnhancer

# --- QUẢN LÝ EXCEL ---
class ViolationLogger:
    def __init__(self, folder="violations"):
        self.folder = folder
        if not os.path.exists(self.folder):
            os.makedirs(self.folder)
            
        self.start_time_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.filename = os.path.join(self.folder, f"baocao_PPE_{self.start_time_str}.xlsx")
        self.columns = ['Thời gian', 'Loại vi phạm', 'Lý do', 'Hình ảnh']
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Vi phạm"
        ws.append(self.columns)
        
        ws.column_dimensions['A'].width = 25
        ws.column_dimensions['B'].width = 20
        ws.column_dimensions['C'].width = 45
        ws.column_dimensions['D'].width = 30
        wb.save(self.filename)

    def log_to_excel(self, violations, frame):
        try:
            wb = openpyxl.load_workbook(self.filename)
            ws = wb.active
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            violation_str = ", ".join(violations)
            
            current_row = ws.max_row + 1
            ws.append([now, violation_str, f"Phát hiện thiếu: {violation_str.upper()}", ""]) 

            success, encoded_image = cv2.imencode('.jpg', frame)
            if success:
                img_data = io.BytesIO(encoded_image.tobytes())
                img = OpenpyxlImage(img_data)
                img.width, img.height = 200, 150
                ws.row_dimensions[current_row].height = 120 
                ws.add_image(img, f'D{current_row}')

            wb.save(self.filename)
        except Exception as e:
            print(f"Lỗi ghi Excel: {e}")

# --- BỘ NHẬN DIỆN YOLO TÍCH HỢP IMAGE ENHANCER ---
class PPEDetector:
    def __init__(self, model_path):
        self.model = YOLO(model_path)
        self.class_names = self.model.names 
        self.violation_start_time = None 

    def detect_and_check(self, frame, required_items):

        # 1. Giảm nhiễu
        processed_frame = ImageEnhancer.reduce_noise(frame)
        # 2. Cân bằng độ tương phản (CLAHE)
        processed_frame = ImageEnhancer.apply_clahe(processed_frame)
        # 3. Làm sắc nét để AI dễ nhận diện cạnh vật thể
        processed_frame = ImageEnhancer.sharpen_image(processed_frame)

        # Nhận diện vật thể 
        results = self.model(processed_frame, stream=True, conf=0.4)
        
        detected_classes = set()
        annotated_frame = frame.copy() # Vẽ lên frame gốc để hiển thị trung thực
        
        found_person = False
        for r in results:
            # Lấy thông tin vẽ box từ ảnh xử lý áp lên frame hiển thị
            annotated_frame = r.plot(img=annotated_frame) 
            for box in r.boxes:
                name = self.class_names.get(int(box.cls), "Unknown")
                detected_classes.add(name)
                if name == 'Person': found_person = True

        # Logic kiểm tra vi phạm
        violations = []
        for item in required_items:
            # Kiểm tra nếu thiếu item so với yêu cầu
            if (found_person and item not in detected_classes):
                violations.append(item)

        is_safe = True
        msg, color = "SCANNING...", (255, 255, 0)

        if found_person and violations:
            if self.violation_start_time is None: self.violation_start_time = time.time()
            elapsed = time.time() - self.violation_start_time
            if elapsed >= 2:
                is_safe, msg, color = False, f"DANGER: MISSING {', '.join(violations)}", (0, 0, 255)
            else:
                msg, color = f"VERIFYING ({int(2-elapsed)}s)", (0, 255, 255)
        else:
            self.violation_start_time = None
            if found_person: msg, color = "STATUS: SAFE", (0, 255, 0)

        cv2.putText(annotated_frame, msg, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        return annotated_frame, is_safe, violations

# --- GIAO DIỆN NGƯỜI DÙNG ---
class PPEApp:
    def __init__(self, window):
        self.window = window
        self.window.title("GIÁM SÁT PPE - ENHANCED VERSION")
        self.window.geometry("1050x700")
        
        self.excel_logger = ViolationLogger()
        self.detector = PPEDetector("weights/best.pt") # Đảm bảo file weight đúng đường dẫn
        self.is_running, self.last_log_time = False, 0
        self._init_ui()

    def _init_ui(self):
        tk.Label(self.window, text="HỆ THỐNG GIÁM SÁT AN TOÀN PPE", font=('Arial', 20, 'bold'), bg='#2c3e50', fg='white', pady=10).pack(fill=tk.X)
        container = tk.Frame(self.window, bg='#ecf0f1')
        container.pack(expand=True, fill=tk.BOTH, padx=10, pady=10)

        self.canvas = tk.Canvas(container, width=800, height=500, bg="black")
        self.canvas.pack(side=tk.LEFT, padx=10)

        right_panel = tk.Frame(container, bg='#ecf0f1')
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        tk.Label(right_panel, text="CÀI ĐẶT KIỂM TRA", font=('Arial', 12, 'bold'), bg='#ecf0f1').pack(pady=10)
        self.check_vars = {k: tk.BooleanVar(value=True) for k in ['Hardhat', 'Safety Vest', 'Mask']}
        for text, var in self.check_vars.items():
            tk.Checkbutton(right_panel, text=text, variable=var, bg='#ecf0f1', font=('Arial', 11)).pack(anchor=tk.W, padx=20)

        btn_s = {'width': 20, 'font': ('Arial', 10, 'bold'), 'pady': 5}
        tk.Button(right_panel, text="📁 CHỌN ẢNH", command=self.process_image, **btn_s).pack(pady=5)
        tk.Button(right_panel, text="🎬 CHỌN VIDEO", command=self.process_video, **btn_s).pack(pady=5)
        tk.Button(right_panel, text="📊 MỞ FILE EXCEL", command=self.open_excel, bg='#27ae60', fg='white', **btn_s).pack(pady=5)
        tk.Button(right_panel, text="🛑 DỪNG", command=self.stop_stream, bg='#e74c3c', fg='white', **btn_s).pack(pady=15)

        self.status_lbl = tk.Label(self.window, text="SẴN SÀNG", font=('Arial', 14, 'bold'), bg='#34495e', fg='white', pady=5)
        self.status_lbl.pack(fill=tk.X, side=tk.BOTTOM)

    def update_display(self, frame):
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img_rgb)
        img_pil.thumbnail((800, 500))
        self.photo = ImageTk.PhotoImage(image=img_pil)
        self.canvas.create_image(400, 250, image=self.photo)

    def process_image(self):
        path = filedialog.askopenfilename()
        if path: 
            self.stop_stream()
            frame = cv2.imread(path)
            if frame is not None:
                self._run_logic(frame)

    def process_video(self):
        path = filedialog.askopenfilename()
        if path:
            self.stop_stream()
            self.is_running = True
            threading.Thread(target=self.video_loop, args=(path,), daemon=True).start()

    def video_loop(self, path):
        cap = cv2.VideoCapture(path)
        while self.is_running and cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            self._run_logic(frame)
            time.sleep(0.01)
        cap.release()
        self.is_running = False

    def _run_logic(self, frame):
        req = [k for k, v in self.check_vars.items() if v.get()]
        res_f, safe, viol = self.detector.detect_and_check(frame, req)
        self.window.after(0, self.update_display, res_f)
        
        if not safe:
            self.window.after(0, lambda: self.status_lbl.config(text=f"CẢNH BÁO: THIẾU {', '.join(viol).upper()}", bg='#e74c3c'))
            if time.time() - self.last_log_time > 5:
                self.excel_logger.log_to_excel(viol, frame)
                self.last_log_time = time.time()
        else:
            self.window.after(0, lambda: self.status_lbl.config(text="TRẠNG THÁI: AN TOÀN", bg='#27ae60'))

    def open_excel(self):
        try: os.startfile(os.path.abspath(self.excel_logger.filename))
        except: messagebox.showerror("Lỗi", "Không thể mở file.")

    def stop_stream(self):
        self.is_running = False
        time.sleep(0.2)
        self.canvas.delete("all")
        self.status_lbl.config(text="SẴN SÀNG", bg='#34495e')

if __name__ == "__main__":
    root = tk.Tk()
    PPEApp(root)
    root.mainloop()