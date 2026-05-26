import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PPEVideoCanvas from "../components/PPEVideoCanvas.jsx";
import "./DetectPage.css";

const DetectPage = () => {
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
    const fileInputRef = useRef(null);

    const [videoSource, setVideoSource] = useState("webcam");
    const [isCamOn, setIsCamOn] = useState(false); // Mặc định ban đầu tắt để người dùng chủ động kích hoạt
    const [systemStatus, setSystemStatus] = useState("Safe");
    const [violations, setViolations] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [cameraId, setCameraId] = useState(null);
    const [userCameras, setUserCameras] = useState([]);
    const [selectedFileName, setSelectedFileName] = useState("");

    // ---- TẦNG 1: TẢI DANH SÁCH CAMERA TỪ SPRING BOOT BACKEND ----
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated && !currentUser) {
            navigate("/login");
            return;
        }

        const fetchUserCameras = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/v1/cameras/user/${currentUser.id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${currentUser.token}`
                    },
                    credentials: "include"
                });
                if (response.ok) {
                    const result = await response.json();
                    const activeCameras = result.data || [];
                    setUserCameras(activeCameras);
                    if (activeCameras.length > 0 && !cameraId) {
                        setCameraId(activeCameras[0].id);
                    }
                }
            } catch (err) {
                console.error("Không thể tải danh sách camera thiết bị:", err);
            }
        };

        if (currentUser?.id) {
            fetchUserCameras();
        }
    }, [currentUser, isAuthenticated, authLoading, navigate]);

    // Xử lý khi người dùng chọn nguồn là File Video mẫu
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsCamOn(false);
            setVideoSource("file");
            setSelectedFileName(file.name);
            const fileURL = URL.createObjectURL(file);
            if (window.loadVideoFileToCanvas) {
                window.loadVideoFileToCanvas(fileURL);
            }
        }
    };

    // Hàm đổi trạng thái Bật/Tắt Camera
    const handleToggleCamera = () => {
        if (videoSource !== "webcam") {
            setVideoSource("webcam");
        }
        setIsCamOn(!isCamOn);
    };

    return (
        <div className="detect-page-wrapper">
            <header className="detect-header">
                <div>
                    <h1 className="detect-title">Giám Sát Khử Khuẩn & <span>An Toàn PPE</span></h1>
                    <p className="detect-subtitle">Phân tích thị giác máy tính real-time kiểm tra trang phục bảo hộ nhà xưởng.</p>
                </div>
                <div className={`status-server-badge ${isConnected ? "connected" : "disconnected"}`}>
                    {isConnected ? "● AI SERVER CONNECTED" : "○ AI SERVER DISCONNECTED"}
                </div>
            </header>

            {/* BAR ĐIỀU KHIỂN CẤU HÌNH - TÍCH HỢP NÚT BẬT TẮT CAMERA */}
            <section className="config-card-bar" style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "1.5rem", background: "#1e293b", padding: "1rem", borderRadius: "8px" }}>

                <div className="config-item">
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "#94a3b8", fontSize: "0.85rem" }}>CHỌN NGUỒN VIDEO:</label>
                    <div className="btn-group-toggle" style={{ display: "flex", gap: "0.5rem" }}>
                        <button type="button" className={`toggle-btn ${videoSource === "webcam" ? "active" : ""}`} onClick={() => { setVideoSource("webcam"); setIsCamOn(false); }}>
                            📷 Webcam Laptop
                        </button>
                        <button type="button" className={`toggle-btn ${videoSource === "file" ? "active" : ""}`} onClick={() => { fileInputRef.current?.click(); }}>
                            📁 Tải File Video
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} accept="video/*" style={{ display: "none" }} onChange={handleFileChange} />
                </div>

                {/* NÚT BẬT / TẮT CAMERA - LUÔN HIỂN THỊ KHI SOURCE LÀ WEBCAM */}
                {videoSource === "webcam" && (
                    <div className="config-item">
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "#94a3b8", fontSize: "0.85rem" }}>TRẠNG THÁI THIẾT BỊ:</label>
                        <button
                            type="button"
                            className={`cam-toggle-action-btn ${isCamOn ? "cam-active" : "cam-inactive"}`}
                            onClick={handleToggleCamera}
                            style={{
                                padding: "0.55rem 1.2rem",
                                fontWeight: "bold",
                                borderRadius: "6px",
                                cursor: "pointer",
                                border: "1px solid",
                                transition: "all 0.2s ease",
                                backgroundColor: isCamOn ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                color: isCamOn ? "#10b981" : "#ef4444",
                                borderColor: isCamOn ? "#10b981" : "#ef4444"
                            }}
                        >
                            {isCamOn ? "🟢 CAMERA ĐANG BẬT (BẤM TẮT)" : "⚫ CAMERA ĐANG TẮT (BẤM BẬT)"}
                        </button>
                    </div>
                )}

                <div className="config-item select-box-item" style={{ marginLeft: "auto" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", color: "#94a3b8", fontSize: "0.85rem" }}>KẾT NỐI MẮT CAMERA HỆ THỐNG:</label>
                    <select className="camera-select" value={cameraId || ""} onChange={(e) => setCameraId(e.target.value)}>
                        {userCameras.length === 0 ? (
                            <option value="">Không có camera khả dụng</option>
                        ) : (
                            userCameras.map((cam) => (
                                <option key={cam.id} value={cam.id}>
                                    {cam.cameraName} ({cam.location})
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </section>

            <div className="detect-main-layout">
                <article className="video-stream-box" style={{ position: "relative", minHeight: "480px", backgroundColor: "#020617", borderRadius: "8px", overflow: "hidden" }}>

                    {/* KHU VỰC PHÁT LUỒNG VIDEO CHUYÊN DỤNG */}
                    <PPEVideoCanvas
                        cameraId={cameraId}
                        videoSource={videoSource}
                        isCamOn={isCamOn}
                        onStatusChange={setSystemStatus}
                        onViolationsChange={setViolations}
                        onServerConnectionChange={setIsConnected}
                    />

                    {/* MÀN HÌNH CHỜ THÔNG BÁO NGHỈ KHI TẮT CAMERA */}
                    {videoSource === "webcam" && !isCamOn && (
                        <div className="camera-placeholder-overlay" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", backgroundColor: "#020617", color: "#64748b" }}>
                            <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>📷❌</span>
                            <p style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#cbd5e1", margin: "0 0 0.5rem 0" }}>Hệ thống camera đang ở trạng thái nghỉ.</p>
                            <small style={{ color: "#475569" }}>Vui lòng nhấn nút "⚫ CAMERA ĐANG TẮT (BẤM BẬT)" phía trên để kích hoạt nhận diện.</small>
                        </div>
                    )}
                </article>

                <aside className="side-control-panel">
                    <div className={`alarm-status-card ${systemStatus === "Danger" ? "danger-alert" : "safe-alert"}`}>
                        <span className="card-label">TRẠNG THÁI HỆ THỐNG</span>
                        <h2 className="card-value">{systemStatus.toUpperCase()}</h2>
                    </div>

                    <div className="realtime-log-card">
                        <h3 className="card-title">Vi Phạm Hiện Thời (Real-time Tracking):</h3>
                        {violations.length === 0 ? (
                            <div className="empty-violation">Toàn bộ nhân sự đang chấp hành đúng quy định an toàn.</div>
                        ) : (
                            <ul className="violation-list-wrapper">
                                {violations.map((v, idx) => (
                                    <li key={idx} className="violation-item-row">
                                        <span className="warning-icon">⚠️</span>
                                        <span className="warning-text">Cảnh báo vi phạm: <strong>{v}</strong></span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="rules-summary-card">
                        <h3 className="card-title">Tham Số Ràng Buộc AI:</h3>
                        <div className="rule-bullet">• Chuẩn hóa dữ liệu: <b>JPEG Lossless 1.0 (RGB)</b></div>
                        <div className="rule-bullet">• Thuật toán chống rung: <b>Multi-Object Track ID Matrix</b></div>
                        <div className="rule-bullet">• Độ trễ cảnh báo: <b>Kích hoạt Unsafe sau 5s vi phạm liên tục</b></div>
                        <div className="rule-bullet">• Lưu trữ: <b>Ghi log cơ sở dữ liệu và kết xuất Excel thống kê</b></div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default DetectPage;