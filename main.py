import cv2
import os
import time
import threading
import sqlite3
import tkinter as tk
from tkinter import filedialog
from PIL import Image, ImageTk
from ultralytics import YOLO

# ==========================================
# 1. DATABASE LOGIC
# ==========================================
class ViolationDB:
    def __init__(self):
        self.conn = sqlite3.connect("ppe_history.db", check_same_thread=False)
        cursor = self.conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS violations 
                          (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                           time TEXT, items TEXT, image_path TEXT)''')
        self.conn.commit()

    def log(self, items, path):
        t = time.strftime("%Y-%m-%d %H:%M:%S")
        cursor = self.conn.cursor()
        cursor.execute("INSERT INTO violations (time, items, image_path) VALUES (?, ?, ?)", (t, items, path))
        self.conn.commit()

# ==========================================
# 2. DETECTION LOGIC (Đã thêm nhãn Mask)
# ==========================================
class PPEDetector:
    def __init__(self, model_path):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Không tìm thấy model tại: {model_path}")
        self.model = YOLO(model_path)
        self.class_names = self.model.names 
        self.violation_start_time = None 

    def detect_and_check(self, frame, required_items):
        # conf=0.25 giúp phát hiện các vật thể nhỏ như khẩu trang tốt hơn
        results = self.model(frame, stream=True, conf=0.25)
        detected_classes = set()
        detected_objects = [] 
        annotated_frame = frame.copy()
        
        found_person = False
        for r in results:
            annotated_frame = r.plot() 
            for box in r.boxes:
                c = int(box.cls)
                name = self.class_names.get(c, "Unknown")
                detected_classes.add(name)
                
                if name == 'Person':
                    found_person = True
                
                coords = box.xyxy[0].cpu().numpy().astype(int)
                detected_objects.append({'name': name, 'box': coords})

        # Logic kiểm tra vi phạm (Dựa trên nhãn có sẵn trong model)
        violations = []
        
        # Kiểm tra Mũ (Hardhat)
        if 'Hardhat' in required_items:
            if 'NO-Hardhat' in detected_classes or (found_person and 'Hardhat' not in detected_classes):
                violations.append("Hardhat")
        
        # Kiểm tra Áo (Safety Vest)
        if 'Safety Vest' in required_items:
            if 'NO-Safety Vest' in detected_classes or (found_person and 'Safety Vest' not in detected_classes):
                violations.append("Safety Vest")
                
        # Kiểm tra Khẩu trang (Mask)
        if 'Mask' in required_items:
            if 'NO-Mask' in detected_classes or (found_person and 'Mask' not in detected_classes):
                violations.append("Mask")

        is_safe = True
        msg = "SCANNING..."
        color = (255, 255, 0)

        if found_person and len(violations) > 0:
            if self.violation_start_time is None:
                self.violation_start_time = time.time()
            
            elapsed = time.time() - self.violation_start_time
            if elapsed >= 2: # Sau 2s xác nhận vi phạm
                is_safe = False
                msg = f"DANGER: MISSING {', '.join(violations).upper()}"
                color = (0, 0, 255)
            else:
                msg = f"VERIFYING ({int(2-elapsed)}s)"
                color = (0, 255, 255)
        else:
            self.violation_start_time = None
            if found_person:
                msg = "STATUS: SAFE"
                color = (0, 255, 0)

        cv2.putText(annotated_frame, msg, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        return annotated_frame, is_safe, violations, detected_objects

# ==========================================
# 3. MAIN GUI APP
# ==========================================
class PPEApp:
    def __init__(self, window):
        self.window = window
        self.window.title("HỆ THỐNG GIÁM SÁT PPE")
        self.window.geometry("1200x800")
        self.window.configure(bg='#ecf0f1')

        self.db = ViolationDB()
        self.detector = PPEDetector("weights/best.pt") # Đảm bảo file model đặt đúng tên
        if not os.path.exists("violations"): os.makedirs("violations")

        self.is_running = False
        self.last_log_time = 0
        self._init_ui()

    def _init_ui(self):
        tk.Label(self.window, text="GIÁM SÁT AN TOÀN LAO ĐỘNG", font=('Arial', 20, 'bold'), 
                 bg='#2c3e50', fg='white', pady=10).pack(fill=tk.X)

        container = tk.Frame(self.window, bg='#ecf0f1')
        container.pack(expand=True, fill=tk.BOTH, padx=10, pady=10)

        # Màn hình Video
        self.canvas = tk.Canvas(container, width=850, height=550, bg="black")
        self.canvas.pack(side=tk.LEFT, padx=10)

        # Bảng điều khiển bên phải
        right_panel = tk.Frame(container, bg='#ecf0f1')
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        tk.Label(right_panel, text="YÊU CẦU BẢO HỘ", font=('Arial', 12, 'bold'), bg='#ecf0f1').pack(pady=10)
        
        # Danh sách Checklist đầy đủ
        self.check_vars = {
            'Hardhat': tk.BooleanVar(value=True),
            'Safety Vest': tk.BooleanVar(value=True),
            'Mask': tk.BooleanVar(value=True)
        }
        for text, var in self.check_vars.items():
            tk.Checkbutton(right_panel, text=text, variable=var, bg='#ecf0f1', font=('Arial', 11)).pack(anchor=tk.W, padx=20)

        btn_frame = tk.Frame(right_panel, bg='#ecf0f1')
        btn_frame.pack(pady=20)
        btn_s = {'width': 18, 'font': ('Arial', 10, 'bold'), 'pady': 5}
        
        tk.Button(btn_frame, text="📁 CHỌN ẢNH", command=self.process_image, **btn_s).pack(pady=5)
        tk.Button(btn_frame, text="🎬 CHỌN VIDEO", command=self.process_video, **btn_s).pack(pady=5)
        tk.Button(btn_frame, text="🛑 DỪNG", command=self.stop_stream, bg='#e74c3c', fg='white', **btn_s).pack(pady=15)

        # Khu vực hiển thị ảnh cắt (Crops)
        self.crop_box = tk.LabelFrame(right_panel, text="ĐỐI TƯỢNG PHÁT HIỆN", bg='#ecf0f1')
        self.crop_box.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        self.status_lbl = tk.Label(self.window, text="SẴN SÀNG", font=('Arial', 14, 'bold'), bg='#34495e', fg='white', pady=5)
        self.status_lbl.pack(fill=tk.X, side=tk.BOTTOM)

    def update_display(self, frame):
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img_rgb)
        img_pil.thumbnail((850, 550))
        self.photo = ImageTk.PhotoImage(image=img_pil)
        self.canvas.create_image(425, 275, image=self.photo)

    def display_crops(self, frame, detected_objects):
        """Cắt ảnh các vật thể đang được chọn trên checklist"""
        for widget in self.crop_box.winfo_children(): widget.destroy()
        count = 0
        target_labels = ['Hardhat', 'Safety Vest', 'Mask', 'NO-Hardhat', 'NO-Safety Vest', 'NO-Mask']
        
        for obj in detected_objects:
            if count >= 3: break # Hiển thị tối đa 3 ảnh cắt để tránh lag
            if obj['name'] in target_labels:
                x1, y1, x2, y2 = obj['box']
                # Xử lý tọa độ biên
                h, w, _ = frame.shape
                y1, y2 = max(0, y1), min(h, y2)
                x1, x2 = max(0, x1), min(w, x2)
                
                crop = frame[y1:y2, x1:x2]
                if crop.size > 0:
                    crop_pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)).resize((100, 100))
                    crop_tk = ImageTk.PhotoImage(crop_pil)
                    lbl = tk.Label(self.crop_box, image=crop_tk, text=obj['name'], compound=tk.TOP, bg='#ecf0f1')
                    lbl.image = crop_tk
                    lbl.pack(side=tk.TOP, pady=5)
                    count += 1

    def process_image(self):
        path = filedialog.askopenfilename()
        if path:
            self.stop_stream()
            frame = cv2.imread(path)
            self._run_logic(frame)

    def process_video(self):
        path = filedialog.askopenfilename()
        if path:
            self.stop_stream()
            self.is_running = True
            threading.Thread(target=self.video_loop, args=(path,), daemon=True).start()

    def video_loop(self, path):
        cap = cv2.VideoCapture(path)
        while self.is_running:
            ret, frame = cap.read()
            if not ret: break
            self._run_logic(frame)
            time.sleep(0.01) # Giữ cho UI phản hồi tốt
        cap.release()
        self.is_running = False

    def _run_logic(self, frame):
        required = [k for k, v in self.check_vars.items() if v.get()]
        res_frame, is_safe, violations, objs = self.detector.detect_and_check(frame, required)
        
        # Cập nhật hình ảnh lên Canvas
        self.window.after(0, self.update_display, res_frame)
        
        # Cập nhật trạng thái Safety/Unsafe
        if not is_safe:
            msg = f"CẢNH BÁO: THIẾU {', '.join(violations).upper()}"
            self.window.after(0, lambda m=msg: self.status_lbl.config(text=m, bg='#e74c3c'))
            self.handle_log(frame, violations)
        else:
            self.window.after(0, lambda: self.status_lbl.config(text="TRẠNG THÁI: AN TOÀN", bg='#27ae60'))
        
        # Cập nhật ảnh cắt mỗi 0.5 giây
        if int(time.time() * 10) % 5 == 0:
            self.window.after(0, self.display_crops, frame, objs)

    def handle_log(self, frame, violations):
        if time.time() - self.last_log_time > 5:
            path = f"violations/danger_{int(time.time())}.jpg"
            cv2.imwrite(path, frame)
            self.db.log(", ".join(violations), path)
            self.last_log_time = time.time()

    def stop_stream(self):
        self.is_running = False
        time.sleep(0.2)
        self.canvas.delete("all")
        self.status_lbl.config(text="SẴN SÀNG", bg='#34495e')

if __name__ == "__main__":
    root = tk.Tk()
    app = PPEApp(root)
    root.mainloop()