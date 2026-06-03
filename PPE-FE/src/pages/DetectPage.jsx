import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PPEVideoCanvas from "../components/PPEVideoCanvas.jsx";
import "./DetectPage.css";

const DetectPage = () => {
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
    const fileInputRef = useRef(null);

    // Đón nhận context trạng thái và hiệu ứng từ MainLayout đẩy xuống
    const { systemStatus, setSystemStatus, isFlashActive } = useOutletContext();

    const [videoSource, setVideoSource] = useState("webcam");
    const [isCamOn, setIsCamOn] = useState(false);
    const [, setViolations] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [cameraId, setCameraId] = useState(null);
    const [userCameras, setUserCameras] = useState([]);
    const [selectedFileName, setSelectedFileName] = useState("");

    const [checkedRules, setCheckedRules] = useState({
        hardhat: true,
        vest: true,
        mask: false
    });

    // Tự động reset về "Safe" khi trạng thái ON/OFF Camera thay đổi hoặc đổi Source
    useEffect(() => {
        setSystemStatus("Safe");
    }, [isCamOn, videoSource, setSystemStatus]);

    // Fetch danh sách camera của user
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
                        handleCameraSelection(activeCameras[0], activeCameras);
                    }
                }
            } catch (err) {
                console.error("Failed to load camera streams:", err);
            }
        };

        if (currentUser?.id) {
            fetchUserCameras();
        }
    }, [currentUser, isAuthenticated, authLoading, navigate, cameraId]);

    const handleCameraSelection = (selectedCam, currentList = userCameras) => {
        if (!selectedCam) return;
        setCameraId(selectedCam.id);

        const rtspLink = selectedCam.cameraUrl || selectedCam.rtspUrl || selectedCam.streamUrl;
        const isWebcam = rtspLink === "0" || rtspLink === 0;

        setSystemStatus("Safe");

        if (isWebcam) {
            setVideoSource("webcam");
            setSelectedFileName("");
            setIsCamOn(false);
        } else if (rtspLink && rtspLink.trim().toLowerCase().startsWith("rtsp://")) {
            setIsCamOn(false);
            setVideoSource("rtsp");
            setSelectedFileName("");
            if (window.loadRtspStreamToCanvas) {
                window.loadRtspStreamToCanvas(rtspLink);
            }
        } else {
            setVideoSource("webcam");
        }
    };

    // TÍNH NĂNG NÂNG CẤP: Xử lý nạp file và kích hoạt ID giả lập để luồng Detect chạy
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsCamOn(false);
            setVideoSource("file");
            setSelectedFileName(file.name);
            setSystemStatus("Safe");

            // Ép kích hoạt cameraId để kích hoạt cổng kết nối WebSocket ở component con
            if (!cameraId && userCameras.length > 0) {
                setCameraId(userCameras[0].id);
            } else if (!cameraId) {
                setCameraId(9999); // ID mặc định dự phòng nếu DB chưa có camera nào
            }

            const fileURL = URL.createObjectURL(file);
            if (window.loadVideoFileToCanvas) {
                window.loadVideoFileToCanvas(fileURL);
            }
        }
    };

    const handleToggleCamera = () => {
        if (videoSource !== "webcam") setVideoSource("webcam");
        setIsCamOn(!isCamOn);
    };

    const toggleRule = (key) => {
        setCheckedRules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="detect-page-wrapper">
            <div className="cyber-grid"></div>
            <div className="ambient-glow cyan"></div>

            <header className="detect-header">
                <div>
                    <span className="tech-tag">AI LIVE MONITOR</span>
                    <h1 className="detect-title">Safety Detection Panel</h1>
                    <p className="detect-subtitle">Real-time artificial intelligence scanning for safety equipment compliance.</p>
                </div>
                <div className={`status-server-badge ${isConnected ? "connected" : "disconnected"}`}>
                    <span className="pulse-indicator"></span>
                    {isConnected ? "AI ENGINE: CONNECTED" : "AI ENGINE: DISCONNECTED"}
                </div>
            </header>

            <section className="config-card-bar">
                <div className="config-item select-box-item">
                    <label className="config-label">SELECT INPUT SOURCE</label>
                    <select
                        className="camera-select"
                        value={cameraId || ""}
                        onChange={(e) => {
                            const foundCam = userCameras.find(c => c.id === parseInt(e.target.value));
                            handleCameraSelection(foundCam);
                        }}
                    >
                        {userCameras.length === 0 ? (
                            <option value="">No cameras configured</option>
                        ) : (
                            userCameras.map((cam) => {
                                const isWebcam = cam.cameraUrl === "0" || cam.cameraUrl === 0;
                                return (
                                    <option key={cam.id} value={cam.id}>
                                        {isWebcam ? "💻 Webcam" : "🌐 IP Cam"} : {cam.cameraName} ({cam.location || "No Location"})
                                    </option>
                                );
                            })
                        )}
                    </select>
                </div>

                <div className="config-item">
                    <label className="config-label">QUICK MODE OVERRIDE</label>
                    <div className="btn-group-toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${videoSource === "webcam" ? "active" : ""}`}
                            onClick={() => { setVideoSource("webcam"); setIsCamOn(false); }}
                        >
                            💻 Local Webcam Mode
                        </button>

                        <button
                            type="button"
                            className={`toggle-btn ${videoSource === "rtsp" ? "active" : ""}`}
                            disabled={!userCameras.find(c => c.id === cameraId)?.cameraUrl?.startsWith("rtsp://")}
                            onClick={() => { if(videoSource !== "rtsp") { const c = userCameras.find(x => x.id === cameraId); handleCameraSelection(c); } }}
                        >
                            🌐 IP Camera Network Mode
                        </button>

                        <button
                            type="button"
                            className={`toggle-btn ${videoSource === "file" ? "active" : ""}`}
                            onClick={() => { fileInputRef.current?.click(); }}
                        >
                            📁 Upload Local Video File
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} accept="video/*" style={{ display: "none" }} onChange={handleFileChange} />
                </div>

                {videoSource === "webcam" && (
                    <div className="config-item status-action-wrapper">
                        <label className="config-label">HARDWARE PERIPHERAL CONTROL</label>
                        <button
                            type="button"
                            className={`cam-toggle-action-btn ${isCamOn ? "cam-active" : "cam-inactive"}`}
                            onClick={handleToggleCamera}
                        >
                            {isCamOn ? "TURN WEBCAM OFF" : "TURN WEBCAM ON"}
                        </button>
                    </div>
                )}

                {videoSource === "file" && (
                    <div className="config-item status-action-wrapper">
                        <label className="config-label">ACTIVE FILE SOURCE</label>
                        <div className="file-loaded-info-badge">
                            <span>📄 {selectedFileName ? selectedFileName : "No video file loaded"}</span>
                            <button className="btn-re-upload" onClick={() => fileInputRef.current?.click()}>Change File</button>
                        </div>
                    </div>
                )}
            </section>

            <div className="detect-main-layout">
                <div className="left-stream-panel">
                    <article className={`video-stream-box ${isFlashActive ? "canvas-danger-glow" : ""}`}>
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
                                <div className="placeholder-radar-scan"></div>
                                <p className="placeholder-title">Webcam Hardware is Off</p>
                                <small className="placeholder-desc">Click "TURN WEBCAM ON" in the control bar above to initialize streaming capture.</small>
                            </div>
                        )}

                        {videoSource === "rtsp" && (
                            <div className="rtsp-overlay-info">
                                <span className="rtsp-live-dot streaming-pulse"></span> LIVE NETWORK FEED
                            </div>
                        )}

                        {videoSource === "file" && (
                            <div className="rtsp-overlay-info file-mode-badge">
                                <span className="rtsp-live-dot file-pulse"></span> PROCESSING UPLOADED VIDEO
                            </div>
                        )}
                    </article>
                </div>

                <div className="side-control-panel">
                    <div className={`alarm-status-card ${systemStatus.toLowerCase() === "danger" ? "danger-alert" : "safe-alert"}`}>
                        <span className="card-label">CURRENT RISK LEVEL</span>
                        <h2 className="card-value">{systemStatus.toUpperCase()}</h2>
                    </div>

                    <div className="visual-selector-card">
                        <h3 className="card-title">AI Detection Settings</h3>
                        <p className="card-subtitle-desc">Turn on or off specific AI target classes for scanning frames.</p>

                        <div className="premium-checkbox-group">
                            <div className={`premium-checkbox-item ${checkedRules.hardhat ? "is-checked" : ""}`} onClick={() => toggleRule("hardhat")}>
                                <div className="item-icon-box helmet">👷</div>
                                <div className="item-info">
                                    <span className="item-name">Safety Helmet</span>
                                    <span className="item-status-tag">{checkedRules.hardhat ? "SCANNING: ON" : "SCANNING: OFF"}</span>
                                </div>
                                <div className="custom-tick-box">
                                    <span className="tick-mark">✓</span>
                                </div>
                            </div>

                            <div className={`premium-checkbox-item ${checkedRules.vest ? "is-checked" : ""}`} onClick={() => toggleRule("vest")}>
                                <div className="item-icon-box vest">🦺</div>
                                <div className="item-info">
                                    <span className="item-name">Safety Vest</span>
                                    <span className="item-status-tag">{checkedRules.vest ? "SCANNING: ON" : "SCANNING: OFF"}</span>
                                </div>
                                <div className="custom-tick-box">
                                    <span className="tick-mark">✓</span>
                                </div>
                            </div>

                            <div className={`premium-checkbox-item ${checkedRules.mask ? "is-checked" : ""}`} onClick={() => toggleRule("mask")}>
                                <div className="item-icon-box mask">😷</div>
                                <div className="item-info">
                                    <span className="item-name">Face Mask</span>
                                    <span className="item-status-tag">{checkedRules.mask ? "SCANNING: ON" : "SCANNING: OFF"}</span>
                                </div>
                                <div className="custom-tick-box">
                                    <span className="tick-mark">✓</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetectPage;