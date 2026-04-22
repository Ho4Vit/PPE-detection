# 🛡️ PPE DETECTION SYSTEM - GIÁM SÁT AN TOÀN LAO ĐỘNG THÔNG MINH 🛡️

<p align="center">
  <img src="https://img.shields.io/badge/Model-YOLOv8-B12127?style=for-the-badge&logo=yolo&logoColor=white">
  <img src="https://img.shields.io/badge/Training-Google%20Colab-F9AB00?style=for-the-badge&logo=googlecolab&logoColor=white">
  <img src="https://img.shields.io/badge/Framework-PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white">
  <img src="https://img.shields.io/badge/UI-Tkinter-3776AB?style=for-the-badge&logo=python&logoColor=white">
</p>

---

## 🌟 Giới Thiệu Dự Án
Dự án sử dụng sức mạnh của trí tuệ nhân tạo để tự động hóa quy trình giám sát an toàn tại các công trường và nhà máy. Hệ thống tập trung vào việc phát hiện nhanh chóng các **Thiết bị bảo hộ cá nhân (PPE)** nhằm đảm bảo môi trường làm việc an toàn nhất.

> [!TIP]
> **Mục tiêu:** Nhận diện Mũ bảo hiểm (Helmet), Áo phản quang (Vest), và cảnh báo các trường hợp vi phạm quy định bảo hộ trong thời gian thực.

---

## 🛠️ Công Nghệ Sức Mạnh
| Thành phần | Công nghệ sử dụng | Mô tả |
| :--- | :--- | :--- |
| **AI Core** | **YOLOv8** 🚀 | Phiên bản Object Detection mới nhất cho tốc độ xử lý cực nhanh. |
| **Cloud** | **Google Colab** ☁️ | Môi trường huấn luyện mạnh mẽ với GPU cao cấp. |
| **Giao diện** | **Tkinter GUI** 💻 | Ứng dụng Desktop trực quan, thân thiện với người dùng. |
| **Xử lý** | **OpenCV** 📸 | Thu thập và xử lý luồng dữ liệu hình ảnh/video real-time. |

---

## 📊 Kết Quả Huấn Luyện (Training Performance)
Mô hình đã trải qua quy trình huấn luyện nghiêm ngặt trong **50 Epochs**. Kết quả cho thấy sự hội tụ tuyệt vời của các hàm mất mát và sự tăng trưởng ổn định của các chỉ số chính xác.

<p align="center">
  <img src="results.jpg" width="100%" alt="YOLOv8 Training Results">
  <br>
  <i>Biểu đồ phân tích hiệu năng: Precision, Recall và mAP@50 đạt ngưỡng ~99%</i>
</p>

### ✨ Thông số:
* ✅ **mAP50(B):** Đạt gần **0.99** - Khả năng nhận diện cực kỳ chuẩn xác.
* ✅ **Loss Curves:** Giảm mạnh và ổn định, không xảy ra hiện tượng Overfitting.
* ✅ **Speed:** Tối ưu hóa để chạy mượt mà trên cả CPU thông thường thông qua giao diện.
