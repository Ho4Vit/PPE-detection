import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./CameraViolationPage.css";

const VIOLATION_MAP = {
    "NO_HARDHAT": { text: "Không nón bảo hộ", color: "#ef4444", bg: "#fef2f2" },
    "NO_SAFETY_VEST": { text: "Không áo phản quang", color: "#f97316", bg: "#fff7ed" },
    "NO_MASK": { text: "Không đeo khẩu trang", color: "#eab308", bg: "#fefce8" }
};

const CameraViolationPage = () => {
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth(); // Lấy thông tin phiên đăng nhập từ Context

    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Kiểm tra trạng thái đăng nhập hệ thống trước khi thực thi
    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated && !currentUser) {
            navigate("/login");
        }
    }, [currentUser, isAuthenticated, authLoading, navigate]);

    // 1. Tải danh sách camera của chính User (Có đính kèm JWT Token)
    useEffect(() => {
        if (authLoading || !currentUser?.id) return;

        const fetchCameras = async () => {
            const token = currentUser?.token || "";
            try {
                const response = await fetch(`http://localhost:8080/api/v1/cameras/user/${currentUser.id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { "Authorization": `Bearer ${token}` }) // 🟢 Truyền token bảo mật
                    }
                });

                if (response.status === 401) {
                    setError("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
                    setTimeout(() => navigate("/login"), 2000);
                    return;
                }

                if (response.ok) {
                    const result = await response.json();
                    const cameraList = result.data || [];
                    setCameras(cameraList);
                    if (cameraList.length > 0) {
                        setSelectedCameraId(cameraList[0].id); // Tự động chọn mắt camera đầu tiên
                    }
                }
            } catch (err) {
                console.error("Lỗi tải danh sách camera:", err);
                setError("Lỗi kết nối đến máy chủ hệ thống khi lấy danh sách Camera.");
            }
        };

        fetchCameras();
    }, [currentUser, authLoading, navigate]);

    // 2. Tải danh sách vi phạm của Camera được chọn (Có đính kèm JWT Token)
    useEffect(() => {
        if (!selectedCameraId || !currentUser) return;

        const fetchViolations = async () => {
            setLoading(true);
            setError(null);
            const token = currentUser?.token || "";

            try {
                const response = await fetch(`http://localhost:8080/api/v1/violations/camera/${selectedCameraId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { "Authorization": `Bearer ${token}` }) // 🟢 Truyền token bảo mật
                    }
                });

                if (response.status === 401) {
                    setError("Phiên làm việc hết hạn. Không thể tải dữ liệu.");
                    return;
                }

                if (response.ok) {
                    const result = await response.json();
                    setViolations(result.data || []);
                } else {
                    setError("Không thể lấy dữ liệu nhật ký từ máy chủ.");
                }
            } catch (err) {
                setError("Mất kết nối với máy chủ Backend.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchViolations();
    }, [selectedCameraId, currentUser]);

    // Định dạng hiển thị thời gian thực tế
    const formatDateTime = (isoString) => {
        if (!isoString) return "-";
        const date = new Date(isoString);
        return date.toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    return (
        <div className="violation-page-container" style={{ width: "100%", padding: "2rem" }}>
            {/* Header Trang */}
            <header className="violation-header">
                <div>
                    <h1 className="page-title">Nhật Ký Vi Phạm <span>PPE Detection</span></h1>
                    <p className="page-subtitle">Quản lý cấu trúc dữ liệu quan hệ (1 User có nhiều Camera - 1 Camera có nhiều Vi phạm).</p>
                </div>

                {/* Bộ lọc lựa chọn camera động */}
                <div className="filter-box">
                    <label htmlFor="camera-select">MẮT CAMERA GIÁM SÁT CỦA BẠN:</label>
                    <select
                        id="camera-select"
                        value={selectedCameraId}
                        onChange={(e) => setSelectedCameraId(e.target.value)}
                    >
                        {cameras.length === 0 ? (
                            <option value="">Không tìm thấy camera khả dụng</option>
                        ) : (
                            cameras.map((cam) => (
                                <option key={cam.id} value={cam.id}>
                                    📷 {cam.cameraName} ({cam.location || "Chưa gán vị trí"})
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </header>

            {/* Khu vực trạng thái hiển thị chính */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Đang kiểm tra dữ liệu cảnh báo an toàn lao động...</p>
                </div>
            ) : error ? (
                <div className="error-state">❌ {error}</div>
            ) : violations.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">🛡️</span>
                    <h3>Khu vực đang an toàn</h3>
                    <p>Không phát hiện lỗi không đội mũ/mặc áo bảo hộ duy trì quá 5 giây tại mắt camera này.</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="violation-table">
                        <thead>
                        <tr>
                            <th>ID Log</th>
                            <th>Tên Camera</th>
                            <th>Hành Vi Vi Phạm</th>
                            <th>Thời Gian Bắt Đầu</th>
                            <th>Thời Gian Kết Thúc</th>
                            <th>Thời Gian Duy Trì</th>
                            <th>Bằng Chứng Thô</th>
                            <th>Trạng Thái</th>
                        </tr>
                        </thead>
                        <tbody>
                        {violations.map((item) => (
                            <tr key={item.id} className={item.status === "UNRESOLVED" ? "row-unresolved" : ""}>
                                <td className="txt-bold">#{item.id}</td>
                                <td>
                                    <span className="cam-badge">{item.cameraName}</span>
                                </td>
                                <td>
                                    <div className="violation-tags-list">
                                        {item.violationTypes?.map((type, index) => {
                                            const config = VIOLATION_MAP[type] || { text: type, color: "#64748b", bg: "#f1f5f9" };
                                            return (
                                                <span
                                                    key={index}
                                                    className="violation-tag"
                                                    style={{ color: config.color, backgroundColor: config.bg, borderColor: config.color }}
                                                >
                                                    {config.text}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </td>
                                <td>{formatDateTime(item.startTime)}</td>
                                <td>{formatDateTime(item.endTime)}</td>
                                <td className="txt-center txt-bold text-slate">
                                    {item.durationSeconds} giây
                                </td>
                                <td>
                                    {item.violationUrl ? (
                                        <a href={item.violationUrl} target="_blank" rel="noreferrer" className="btn-view-img">
                                            🖼️ Xem ảnh cắt
                                        </a>
                                    ) : (
                                        <span className="no-img-text">🚫 Không lưu ảnh</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`status-badge ${item.status.toLowerCase()}`}>
                                        {item.status === "UNRESOLVED" ? "🔴 Chưa xử lý" : "🟢 Đã nhắc nhở"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CameraViolationPage;