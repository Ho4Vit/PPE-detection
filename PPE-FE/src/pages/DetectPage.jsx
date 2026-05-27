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
    const [isCamOn, setIsCamOn] = useState(false);
    const [systemStatus, setSystemStatus] = useState("Safe");
    const [, setViolations] = useState([]); // Tránh lỗi reference từ canvas
    const [isConnected, setIsConnected] = useState(false);
    const [cameraId, setCameraId] = useState(null);
    const [userCameras, setUserCameras] = useState([]);
    const [selectedFileName, setSelectedFileName] = useState("");

    // ---- ĐIỀU KHIỂN HẠNG MỤC GIÁM SÁT QUA CHECKBOX PREMIUM ----
    const [checkedRules, setCheckedRules] = useState({
        hardhat: true, // Mặc định giám sát Nón bảo hộ
        vest: true,    // Mặc định giám sát Áo phản quang
        mask: false    // Mặc định tắt giám sát Khẩu trang
    });

    // Tải danh sách camera từ backend
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
                console.error("Không thể tải danh sách camera:", err);
            }
        };

        if (currentUser?.id) {
            fetchUserCameras();
        }
    }, [currentUser, isAuthenticated, authLoading, navigate, cameraId]);

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

    const handleToggleCamera = () => {
        if (videoSource !== "webcam") {
            setVideoSource("webcam");
        }
        setIsCamOn(!isCamOn);
    };

    // Hàm xử lý thay đổi checkbox nhanh
    const toggleRule = (key) => {
        setCheckedRules(prev => ({ ...prev, [key]: !prev[key] }));
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

            {/* BAR ĐIỀU KHIỂN CẤU HÌNH TỔNG HỢP */}
            <section className="config-card-bar">
                {/* CHỌN NGUỒN VÀO */}
                <div className="config-item">
                    <label className="config-label">CHỌN NGUỒN VIDEO:</label>
                    <div className="btn-group-toggle">
                        <button type="button" className={`toggle-btn ${videoSource === "webcam" ? "active" : ""}`} onClick={() => { setVideoSource("webcam"); setIsCamOn(false); }}>
                            📷 Webcam Laptop
                        </button>
                        <button type="button" className={`toggle-btn ${videoSource === "file" ? "active" : ""}`} onClick={() => { fileInputRef.current?.click(); }}>
                            📁 {selectedFileName ? `File: ${selectedFileName.substring(0, 10)}...` : "Tải File Video"}
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} accept="video/*" style={{ display: "none" }} onChange={handleFileChange} />
                </div>

                {/* BẬT TẮT CAMERA */}
                {videoSource === "webcam" && (
                    <div className="config-item">
                        <label className="config-label">TRẠNG THÁI THIẾT BỊ:</label>
                        <button
                            type="button"
                            className={`cam-toggle-action-btn ${isCamOn ? "cam-active" : "cam-inactive"}`}
                            onClick={handleToggleCamera}
                        >
                            {isCamOn ? "🟢 CAMERA ĐANG BẬT (BẤM TẮT)" : "⚫ CAMERA ĐANG TẮT (BẤM BẬT)"}
                        </button>
                    </div>
                )}

                {/* CHỌN MẮT CAMERA */}
                <div className="config-item select-box-item" style={{ marginLeft: "auto" }}>
                    <label className="config-label">KẾT NỐI MẮT CAMERA HỆ THỐNG:</label>
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

            {/* BỐ CỤC CHÍNH */}
            <div className="detect-main-layout">
                {/* BÊN TRÁI: KHUNG VIDEO STREAM */}
                <div className="left-stream-panel">
                    <article className="video-stream-box">
                        <PPEVideoCanvas
                            cameraId={cameraId}
                            videoSource={videoSource}
                            isCamOn={isCamOn}
                            checkedRules={checkedRules}
                            onStatusChange={setSystemStatus}
                            onViolationsChange={setViolations}
                            onServerConnectionChange={setIsConnected}
                        />

                        {videoSource === "webcam" && !isCamOn && (
                            <div className="camera-placeholder-overlay">
                                <span className="placeholder-icon">📷❌</span>
                                <p className="placeholder-title">Hệ thống camera đang ở trạng thái nghỉ.</p>
                                <small className="placeholder-desc">Vui lòng nhấn nút "⚫ CAMERA ĐANG TẮT (BẤM BẬT)" phía trên để kích hoạt nhận diện.</small>
                            </div>
                        )}
                    </article>
                </div>

                {/* BÊN PHẢI: PANEL TRẠNG THÁI & BỘ CHỌN CHECKBOX ĐẸP */}
                <aside className="side-control-panel">
                    {/* CARD TRẠNG THÁI AN TOÀN */}
                    <div className={`alarm-status-card ${systemStatus === "Danger" ? "danger-alert" : "safe-alert"}`}>
                        <span className="card-label">TRẠNG THÁI HỆ THỐNG</span>
                        <h2 className="card-value">{systemStatus.toUpperCase()}</h2>
                    </div>

                    <div className="visual-selector-card">
                        <h3 className="card-title">Hạng Mục Giám Sát AI</h3>
                        <p className="card-subtitle-desc">Bật/tắt các lớp quy tắc để AI quét luồng hình ảnh thời gian thực.</p>

                        <div className="premium-checkbox-group">
                            {/* Khối item 1: Nón */}
                            <div className={`premium-checkbox-item ${checkedRules.hardhat ? "is-checked" : ""}`} onClick={() => toggleRule("hardhat")}>
                                <div className="item-icon-box">👷</div>
                                <div className="item-info">
                                    <span className="item-name">Nón bảo hộ</span>
                                    <span className="item-status-tag">{checkedRules.hardhat ? "ĐANG QUÉT" : "BỎ QUA"}</span>
                                </div>
                                <div className="custom-tick-box">
                                    <span className="tick-mark">✓</span>
                                </div>
                            </div>

                            {/* Khối item 2: Áo phản quang */}
                            <div className={`premium-checkbox-item ${checkedRules.vest ? "is-checked" : ""}`} onClick={() => toggleRule("vest")}>
                                <div className="item-icon-box">🦺</div>
                                <div className="item-info">
                                    <span className="item-name">Áo phản quang</span>
                                    <span className="item-status-tag">{checkedRules.vest ? "ĐANG QUÉT" : "BỎ QUA"}</span>
                                </div>
                                <div className="custom-tick-box">
                                    <span className="tick-mark">✓</span>
                                </div>
                            </div>

                            {/* Khối item 3: Khẩu trang */}
                            <div className={`premium-checkbox-item ${checkedRules.mask ? "is-checked" : ""}`} onClick={() => toggleRule("mask")}>
                                <div className="item-icon-box">😷</div>
                                <div className="item-info">
                                    <span className="item-name">Khẩu trang</span>
                                    <span className="item-status-tag">{checkedRules.mask ? "ĐANG QUÉT" : "BỎ QUA"}</span>
                                </div>
                                <div className="custom-tick-box">
                                    <span className="tick-mark">✓</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default DetectPage;