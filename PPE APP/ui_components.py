import tkinter as tk
from tkinter import filedialog
import cv2
from PIL import Image, ImageTk

class VideoDisplay(tk.Canvas):
    def __init__(self, parent, width=800, height=500):
        super().__init__(parent, width=width, height=height, bg="black")
        self.width = width
        self.height = height

    def update_image(self, frame):
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img_rgb)
        img_pil.thumbnail((self.width, self.height), Image.Resampling.LANCZOS)
        self.photo = ImageTk.PhotoImage(image=img_pil)
        self.create_image(self.width//2, self.height//2, image=self.photo, anchor=tk.CENTER)

class ChecklistPanel(tk.LabelFrame):
    def __init__(self, parent):
        super().__init__(parent, text="Yêu cầu bảo hộ bắt buộc", padx=10, pady=10, bg='#ecf0f1', font=('Arial', 10, 'bold'))
        self.vars = {
            'Vest': tk.BooleanVar(value=True),
            'Helmet': tk.BooleanVar(value=True),
            'Shoes': tk.BooleanVar(value=False),
            'Gloves': tk.BooleanVar(value=False)
        }
        for text, var in self.vars.items():
            tk.Checkbutton(self, text=text, variable=var, bg='#ecf0f1', font=('Arial', 10)).pack(anchor=tk.W)

    def get_required(self):
        return [item for item, var in self.vars.items() if var.get()]