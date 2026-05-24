import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./CameraManagement.css";

const CameraManagement = () => {
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();

    const [cameras, setCameras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // State cho Form (Dùng chung cho cả Thêm và Sửa)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCameraId, setCurrentCameraId] = useState(null);
    const [formData, setFormData] = useState({
        cameraName: "",
        cameraUrl: "",
        location: "",
        isActive: true
    });

    // 🌟 API Base URL: Gọi trực tiếp tới Backend Spring Boot ở port 8080
    const API_BASE_URL = "http://localhost:8080/api/v1/cameras";

    // Hàm lấy token từ dữ liệu ppe_user trong localStorage
    const getJwtToken = () => {
        const savedUser = localStorage.getItem("ppe_user");
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            return parsed.token || "";
        }
        return "";
    };

    // Kích hoạt fetch danh sách camera khi User đã xác thực thành công
    useEffect(() => {
        // Đợi AuthContext tải xong trạng thái ban đầu để tránh bị điều hướng nhầm
        if (authLoading) return;

        if (!isAuthenticated && !currentUser) {
            navigate("/login");
            return;
        }

        if (currentUser?.id) {
            fetchCameras(currentUser.id);
        }
    }, [currentUser, isAuthenticated, authLoading, navigate]);

    // 1. GET: Lấy danh sách camera theo User ID
    const fetchCameras = async (userId) => {
        setLoading(true);
        const token = getJwtToken();

        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { "Authorization": `Bearer ${token}` }) // Đính kèm JWT vào Header
                },
                credentials: "include" // Gửi kèm theo Cookie chứa Session/Token sang port 8080
            });

            if (response.status === 401) {
                setError("Phiên đăng nhập hết hạn hoặc không hợp lệ. Đang chuyển hướng...");
                setTimeout(() => navigate("/login"), 2000);
                return;
            }

            const result = await response.json();
            if (response.ok) {
                setCameras(result.data || []);
            } else {
                setError(result.message || "Không thể tải danh sách camera.");
            }
        } catch (err) {
            setError("Lỗi kết nối đến máy chủ hệ thống.");
        } finally {
            setLoading(false);
        }
    };

    // Đóng mở Modal form
    const openModal = (camera = null) => {
        if (camera) {
            setIsEditing(true);
            setCurrentCameraId(camera.id);
            setFormData({
                cameraName: camera.cameraName,
                cameraUrl: camera.cameraUrl,
                location: camera.location,
                isActive: camera.isActive
            });
        } else {
            setIsEditing(false);
            setCurrentCameraId(null);
            setFormData({ cameraName: "", cameraUrl: "", location: "", isActive: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setError("");
    };

    // Handle thay đổi input form
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });
    };

    // 2. POST / PUT: Xử lý Submit Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const url = isEditing ? `${API_BASE_URL}/${currentCameraId}` : API_BASE_URL;
        const method = isEditing ? "PUT" : "POST";
        const token = getJwtToken();

        const payload = isEditing
            ? { ...formData }
            : { ...formData, userId: currentUser.id };

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { "Authorization": `Bearer ${token}` })
                },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (response.status === 401) {
                alert("Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.");
                navigate("/login");
                return;
            }

            const result = await response.json();

            if (response.ok) {
                closeModal();
                fetchCameras(currentUser.id);
            } else {
                setError(result.message || "Xử lý yêu cầu thất bại.");
            }
        } catch (err) {
            setError("Lỗi hệ thống khi gửi dữ liệu.");
        }
    };

    // 3. DELETE: Xóa Camera
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn gỡ bỏ cấu hình camera này?")) return;
        const token = getJwtToken();

        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: "DELETE",
                headers: {
                    ...(token && { "Authorization": `Bearer ${token}` })
                },
                credentials: "include"
            });

            if (response.status === 401) {
                alert("Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.");
                navigate("/login");
                return;
            }

            if (response.ok) {
                fetchCameras(currentUser.id);
            } else {
                const result = await response.json();
                alert(result.message || "Không thể xóa camera.");
            }
        } catch (err) {
            alert("Lỗi kết nối khi thực hiện xóa.");
        }
    };

    return (
        <div className="camera-page-wrapper" style={{ width: "100%", padding: "2rem" }}>
            <main className="camera-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Hệ Thống Quản Lý <span>Camera</span></h1>
                        <p className="dashboard-subtitle">Cấu hình luồng xử lý AI nhận diện đồ bảo hộ lao động cho tài khoản của bạn.</p>
                    </div>
                    <button className="btn-primary btn-add-camera" onClick={() => openModal()}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Thêm Camera Mới
                    </button>
                </div>

                {(authLoading || loading) && <div className="state-message">Đang tải danh sách mắt camera từ server...</div>}
                {error && !isModalOpen && <div className="state-message error-message">{error}</div>}

                {!loading && cameras.length === 0 && (
                    <div className="empty-state">
                        <p>Tài khoản chưa cấu hình mắt camera nào. Vui lòng bấm "Thêm Camera Mới" để bắt đầu thiết lập.</p>
                    </div>
                )}

                <div className="camera-grid">
                    {cameras.map((camera) => (
                        <div key={camera.id} className={`camera-card-item ${camera.isActive ? "active" : "inactive"}`}>
                            <div className="camera-card-header">
                                <div className="camera-icon-bg">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                        <circle cx="12" cy="13" r="4"/>
                                    </svg>
                                </div>
                                <span className={`status-badge ${camera.isActive ? "safe" : "danger"}`}>
                                    {camera.isActive ? "Đang chạy" : "Tạm dừng"}
                                </span>
                            </div>

                            <div className="camera-card-body">
                                <h3 className="camera-name">{camera.cameraName}</h3>
                                <p className="camera-info">
                                    <strong>Vị trí:</strong> {camera.location || "Chưa xác định"}
                                </p>
                                <div className="camera-stream-url">
                                    <code>{camera.cameraUrl}</code>
                                </div>
                            </div>

                            <div className="camera-card-actions">
                                <button className="btn-action-edit" onClick={() => openModal(camera)}>
                                    Sửa Cấu Hình
                                </button>
                                <button className="btn-action-delete" onClick={() => handleDelete(camera.id)}>
                                    Gỡ Bỏ
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{isEditing ? "Cập Nhật Cấu Hình Camera" : "Thêm Mới Mắt Camera"}</h2>
                            <button className="btn-close-modal" onClick={closeModal}>&times;</button>
                        </div>

                        {error && <p className="modal-error">{error}</p>}

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Tên Gợi Nhớ Camera</label>
                                <input
                                    type="text"
                                    name="cameraName"
                                    value={formData.cameraName}
                                    onChange={handleInputChange}
                                    placeholder="Ví dụ: Camera Phân Xưởng Hàn 01"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Đường Dẫn Luồng (RTSP URL / Webcam Index)</label>
                                <input
                                    type="text"
                                    name="cameraUrl"
                                    value={formData.cameraUrl}
                                    onChange={handleInputChange}
                                    placeholder="Ví dụ: rtsp://admin:12345@192.168.1.100:554 hoặc 0 (Webcam)"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Vị Trí Lắp Đặt</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="Ví dụ: Cổng chính ra vào nhà máy"
                                    required
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="isActive">Kích hoạt luồng truyền ngay lập tức cho AI YOLOv8</label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>Hủy</button>
                                <button type="submit" className="btn-primary">{isEditing ? "Cập Nhật" : "Khởi Tạo"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraManagement;