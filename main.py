import os
import shutil
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import cv2
from PIL import Image, ImageTk
from ultralytics import YOLO
import pandas as pd
from datetime import datetime

class PPECropperApp:
    def __init__(self, window):
        self.window = window
        self.window.title("PPE Object Cropping Tool - UTC - Lê An Hòa")
        self.window.geometry("1250x850")
        self.window.configure(bg="#f0f0f0")

        # --- CẤU HÌNH ---
        self.model_path = 'weights/best.pt'
        self.crop_output_dir = 'crops'
        self.excel_path = 'thong_ke_ppe.xlsx'
        
        # Làm sạch thư mục ảnh cắt mỗi khi khởi động
        if os.path.exists(self.crop_output_dir):
            shutil.rmtree(self.crop_output_dir)
        os.makedirs(self.crop_output_dir)

        # Load Model
        if os.path.exists(self.model_path):
            self.model = YOLO(self.model_path)
            # --- ĐÃ CẬP NHẬT LABEL TẠI ĐÂY ---
            self.class_names = {
                0: 'Vest', 
                1: 'Gloves', 
                2: 'Shoes',   # Đổi từ Helmet -> Shoes
                3: 'Person', 
                4: 'Helmet'   # Đổi từ Goggles -> Helmet
            }
            self.model.model.names = self.class_names
        else:
            messagebox.showerror("Lỗi", f"Không tìm thấy file: {self.model_path}")
            self.window.destroy()

        self.original_image_path = None
        self.crop_thumbnails = [] 
        self.init_ui()

    def init_ui(self):
        # 1. TOOLBAR
        toolbar = tk.Frame(self.window, bg="#2c3e50", pady=10)
        toolbar.pack(side=tk.TOP, fill=tk.X)

        tk.Button(toolbar, text="📁 Load Image", command=self.load_image, 
                  font=("Arial", 10, "bold"), bg="#3498db", fg="white", padx=15).pack(side=tk.LEFT, padx=10)
        
        tk.Button(toolbar, text="▶ Run Detection", command=self.run_detection, 
                  font=("Arial", 10, "bold"), bg="#27ae60", fg="white", padx=15).pack(side=tk.LEFT, padx=10)
        
        tk.Button(toolbar, text="📊 Export Excel", command=self.export_excel, 
                  font=("Arial", 10, "bold"), bg="#f39c12", fg="white", padx=15).pack(side=tk.LEFT, padx=10)

        tk.Button(toolbar, text="📂 Open Crops", command=lambda: os.startfile(os.path.abspath(self.crop_output_dir)), 
                  font=("Arial", 10), bg="#95a5a6", fg="white").pack(side=tk.RIGHT, padx=10)

        # 2. MAIN CONTENT
        main_content = tk.Frame(self.window, bg="#f0f0f0")
        main_content.pack(expand=True, fill=tk.BOTH, padx=10, pady=10)

        # 2.1 Bên trái: Ảnh gốc
        left_frame = tk.LabelFrame(main_content, text="Detection Result", font=("Arial", 10, "bold"), bg="white")
        left_frame.pack(side=tk.LEFT, expand=True, fill=tk.BOTH, padx=(0, 10))

        self.img_display = tk.Label(left_frame, text="Chưa có ảnh", bg="#f9f9f9")
        self.img_display.pack(expand=True, fill=tk.BOTH)

        # 2.2 Bên phải: Ảnh cắt
        right_frame = tk.LabelFrame(main_content, text="Cropped Box Preview", 
                                    font=("Arial", 10, "bold"), bg="white", width=350)
        right_frame.pack_propagate(False) 
        right_frame.pack(side=tk.RIGHT, fill=tk.Y)

        self.canvas_scroll = tk.Canvas(right_frame, bg="white", highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(right_frame, orient="vertical", command=self.canvas_scroll.yview)
        self.scrollable_frame = tk.Frame(self.canvas_scroll, bg="white")

        self.scrollable_frame.bind("<Configure>", lambda e: self.canvas_scroll.configure(scrollregion=self.canvas_scroll.bbox("all")))
        self.canvas_scroll.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas_scroll.configure(yscrollcommand=self.scrollbar.set)

        self.canvas_scroll.pack(side=tk.LEFT, expand=True, fill=tk.BOTH)
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Thanh trạng thái
        self.status_var = tk.StringVar(value="Sẵn sàng...")
        status_bar = tk.Label(self.window, textvariable=self.status_var, bd=1, relief=tk.SUNKEN, anchor=tk.W)
        status_bar.pack(side=tk.BOTTOM, fill=tk.X)

    def load_image(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.jpg *.jpeg *.png")])
        if path:
            self.original_image_path = path
            self.clear_ui()
            img = Image.open(path)
            img.thumbnail((800, 600))
            img_tk = ImageTk.PhotoImage(img)
            self.img_display.config(image=img_tk, text="")
            self.img_display.image = img_tk
            self.status_var.set(f"Đã tải: {os.path.basename(path)}")

    def run_detection(self):
        if not self.original_image_path: return
        
        results = self.model.predict(source=self.original_image_path, conf=0.25)
        res = results[0]

        res_plotted = res.plot()
        img_rgb = cv2.cvtColor(res_plotted, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img_rgb)
        img_pil.thumbnail((800, 600))
        img_tk = ImageTk.PhotoImage(img_pil)
        self.img_display.config(image=img_tk)
        self.img_display.image = img_tk

        self.process_crops(res)
        self.last_results = res 

    def process_crops(self, result):
        self.clear_ui(only_crops=True)
        img_cv = cv2.imread(self.original_image_path)
        
        counts = {name: 0 for name in self.class_names.values()}
        
        for i, box in enumerate(result.boxes):
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
            cls_id = int(box.cls[0].cpu().numpy())
            cls_name = self.class_names.get(cls_id, 'Unknown')
            counts[cls_name] += 1
            
            crop = img_cv[y1:y2, x1:x2]
            if crop.size == 0: continue
            
            fname = f"crop_{i}_{cls_name}.jpg"
            fpath = os.path.join(self.crop_output_dir, fname)
            cv2.imwrite(fpath, crop)

            self.add_thumbnail(crop, fname)
        
        self.status_var.set(" | ".join([f"{k}: {v}" for k, v in counts.items() if v > 0]))

    def add_thumbnail(self, cv_img, name):
        rgb = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
        pil = Image.fromarray(rgb)
        pil.thumbnail((120, 120))
        tk_img = ImageTk.PhotoImage(pil)
        self.crop_thumbnails.append(tk_img)

        f = tk.Frame(self.scrollable_frame, bg="white", pady=5)
        f.pack(fill=tk.X)
        tk.Label(f, image=tk_img, bg="white", bd=1, relief=tk.SOLID).pack(side=tk.LEFT, padx=5)
        tk.Label(f, text=name, bg="white", font=("Arial", 9)).pack(side=tk.LEFT)

    def export_excel(self):
        if not hasattr(self, 'last_results'): return
        try:
            counts = {name: 0 for name in self.class_names.values()}
            for cls_id in self.last_results.boxes.cls.cpu().numpy():
                counts[self.class_names[int(cls_id)]] += 1
            
            data = {'Time': datetime.now().strftime("%H:%M:%S"), 'File': os.path.basename(self.original_image_path), **counts}
            df = pd.read_excel(self.excel_path) if os.path.exists(self.excel_path) else pd.DataFrame()
            pd.concat([df, pd.DataFrame([data])]).to_excel(self.excel_path, index=False)
            messagebox.showinfo("OK", "Đã xuất Excel!")
        except Exception as e:
            messagebox.showerror("Lỗi", str(e))

    def clear_ui(self, only_crops=False):
        for w in self.scrollable_frame.winfo_children(): w.destroy()
        self.crop_thumbnails = []
        if not only_crops:
            self.img_display.config(image='', text="Đang tải...")

if __name__ == "__main__":
    root = tk.Tk()
    app = PPECropperApp(root)
    root.mainloop()