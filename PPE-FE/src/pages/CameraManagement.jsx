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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCameraId, setCurrentCameraId] = useState(null);

    // Thêm loại camera: "webcam" hoặc "rtsp"
    const [camType, setCamType] = useState("webcam");
    const [formData, setFormData] = useState({
        cameraName: "",
        cameraUrl: "",
        location: "",
        isActive: true
    });

    const API_BASE_URL = "http://localhost:8080/api/v1/cameras";

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated && !currentUser) {
            navigate("/login");
            return;
        }

        if (currentUser?.id) {
            fetchCameras(currentUser.id);
        }
    }, [currentUser, isAuthenticated, authLoading, navigate]);

    const fetchCameras = async (userId) => {
        setLoading(true);
        const token = currentUser?.token || "";

        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { "Authorization": `Bearer ${token}` })
                },
                credentials: "include"
            });

            if (response.status === 401) {
                setError("Session expired. Redirecting to login...");
                setTimeout(() => navigate("/login"), 2000);
                return;
            }

            const result = await response.json();
            if (response.ok) {
                setCameras(result.data || []);
            } else {
                setError(result.message || "Failed to load camera list.");
            }
        } catch (err) {
            setError("Server connection error.");
        } finally {
            setLoading(false);
        }
    };

    const openModal = (camera = null) => {
        if (camera) {
            setIsEditing(true);
            setCurrentCameraId(camera.id);

            // Kiểm tra xem camera hiện tại là loại nào
            const isWebcam = camera.cameraUrl === "0" || camera.cameraUrl === 0;
            setCamType(isWebcam ? "webcam" : "rtsp");

            setFormData({
                cameraName: camera.cameraName,
                cameraUrl: isWebcam ? "" : camera.cameraUrl,
                location: camera.location,
                isActive: camera.isActive
            });
        } else {
            setIsEditing(false);
            setCurrentCameraId(null);
            setCamType("webcam");
            setFormData({ cameraName: "", cameraUrl: "", location: "", isActive: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setError("");
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const url = isEditing ? `${API_BASE_URL}/${currentCameraId}` : API_BASE_URL;
        const method = isEditing ? "PUT" : "POST";
        const token = currentUser?.token || "";

        // Nếu chọn webcam thì gán cứng url gửi lên server là "0"
        const finalCameraUrl = camType === "webcam" ? "0" : formData.cameraUrl;

        const payload = isEditing
            ? { ...formData, cameraUrl: finalCameraUrl }
            : { ...formData, cameraUrl: finalCameraUrl, userId: currentUser.id };

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
                alert("Session expired. Please log in again.");
                navigate("/login");
                return;
            }

            const result = await response.json();

            if (response.ok) {
                closeModal();
                fetchCameras(currentUser.id);
            } else {
                setError(result.message || "Action failed.");
            }
        } catch (err) {
            setError("System error while saving data.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this camera?")) return;
        const token = currentUser?.token || "";

        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: "DELETE",
                headers: {
                    ...(token && { "Authorization": `Bearer ${token}` })
                },
                credentials: "include"
            });

            if (response.status === 401) {
                alert("Session expired. Please log in again.");
                navigate("/login");
                return;
            }

            if (response.ok) {
                fetchCameras(currentUser.id);
            } else {
                const result = await response.json();
                alert(result.message || "Cannot delete camera.");
            }
        } catch (err) {
            alert("Connection error during deletion.");
        }
    };

    return (
        <div className="camera-management-wrapper">
            <div className="cyber-grid-overlay"></div>
            <div className="ambient-cyan-glow"></div>

            <main className="cam-mgmt-container">
                {/* HEADER CONTROL PANEL */}
                <header className="cam-mgmt-header">
                    <div>
                        <span className="tech-tag-sub">CAMERA INFRASTRUCTURE</span>
                        <h1 className="cam-mgmt-title">Camera Management</h1>
                        <p className="cam-mgmt-subtitle">Manage video streams and local webcams connected to your AI monitoring system.</p>
                    </div>
                    <div className="cam-action-cluster">
                        <button className="btn-cyber-nav" onClick={() => navigate("/detect")}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            Go to AI Monitor
                        </button>
                        <button className="btn-cyber-primary" onClick={() => openModal()}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add New Camera
                        </button>
                    </div>
                </header>

                {/* STATUS BOXES */}
                {(authLoading || loading) && (
                    <div className="cyber-state-box loading">
                        <span className="spinner-radar"></span>
                        Loading device configurations from database...
                    </div>
                )}
                {error && !isModalOpen && (
                    <div className="cyber-state-box error">
                        ⚠️ Error: {error}
                    </div>
                )}

                {!loading && cameras.length === 0 && (
                    <div className="cyber-empty-panel">
                        <div className="empty-cyber-icon">📡</div>
                        <p className="empty-title">No Cameras Found</p>
                        <p className="empty-desc">You haven't added any cameras yet. Create a connection node to start running real-time AI analytics.</p>
                        <button className="btn-cyber-outline" onClick={() => openModal()}>Add First Camera</button>
                    </div>
                )}

                {/* THE GRID CARD LIST */}
                <div className="cyber-camera-grid">
                    {cameras.map((camera) => {
                        const isWebcam = camera.cameraUrl === "0" || camera.cameraUrl === 0;
                        return (
                            <article key={camera.id} className={`cyber-cam-card ${camera.isActive ? "node-active" : "node-suspended"}`}>
                                <div className="card-top-boundary">
                                    <div className="node-hardware-id">
                                        <span className="hardware-tag">ID: #{String(camera.id).padStart(3, '0')}</span>
                                    </div>
                                    <span className={`node-status-chip ${camera.isActive ? "online" : "offline"}`}>
                                        {camera.isActive ? "● Active" : "○ Inactive"}
                                    </span>
                                </div>

                                <div className="card-mid-telemetry">
                                    <div className="hardware-icon-wrapper">
                                        {isWebcam ? (
                                            <span className="type-emoticon">💻</span>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="svg-cam">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                                <circle cx="12" cy="13" r="4"/>
                                            </svg>
                                        )}
                                    </div>
                                    <div className="telemetry-details">
                                        <h3 className="node-title-name">{camera.cameraName}</h3>
                                        <div className="telemetry-meta">
                                            <span className="meta-label">Location:</span>
                                            <span className="meta-value">{camera.location || "Not specified"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-bottom-routing">
                                    <label className="routing-lbl">Connection Path / URL</label>
                                    <div className="routing-code-block">
                                        {isWebcam ? (
                                            <span className="webcam-badge-tag">Local Station Webcam</span>
                                        ) : (
                                            <code>{camera.cameraUrl}</code>
                                        )}
                                    </div>
                                </div>

                                <div className="card-action-footer">
                                    <button className="btn-node-edit" onClick={() => openModal(camera)}>
                                        Edit
                                    </button>
                                    <button className="btn-node-delete" onClick={() => handleDelete(camera.id)}>
                                        Delete
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </main>

            {/* MANAGEMENT MODAL OVERLAY */}
            {isModalOpen && (
                <div className="cyber-modal-overlay">
                    <div className="cyber-modal-container">
                        <div className="cyber-modal-header">
                            <div>
                                <span className="tech-tag-sub">DEVICE CONFIGURATION</span>
                                <h2 className="modal-headline">{isEditing ? "Edit Camera Node" : "Register New Camera"}</h2>
                            </div>
                            <button className="btn-cyber-close" onClick={closeModal}>&times;</button>
                        </div>

                        {error && <div className="modal-cyber-error">⚠️ {error}</div>}

                        <form onSubmit={handleSubmit} className="cyber-modal-form">
                            {/* CHỌN NHANH LOẠI CAMERA */}
                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Select Device Type</label>
                                <div className="cam-type-selector">
                                    <button
                                        type="button"
                                        className={`type-select-btn ${camType === "webcam" ? "selected" : ""}`}
                                        onClick={() => setCamType("webcam")}
                                    >
                                        💻 Local Webcam
                                    </button>
                                    <button
                                        type="button"
                                        className={`type-select-btn ${camType === "rtsp" ? "selected" : ""}`}
                                        onClick={() => setCamType("rtsp")}
                                    >
                                        🌐 IP Camera (RTSP)
                                    </button>
                                </div>
                            </div>

                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Camera Title / Name</label>
                                <input
                                    type="text"
                                    name="cameraName"
                                    className="cyber-form-input"
                                    value={formData.cameraName}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Main Production Line Cam"
                                    required
                                />
                            </div>

                            {/* CHỈ HIỆN INPUT NÀY NẾU CHỌN LOẠI CAMERA LÀ RTSP */}
                            {camType === "rtsp" && (
                                <div className="cyber-form-group">
                                    <label className="cyber-form-label">RTSP Stream Link URL</label>
                                    <input
                                        type="text"
                                        name="cameraUrl"
                                        className="cyber-form-input"
                                        value={formData.cameraUrl}
                                        onChange={handleInputChange}
                                        placeholder="rtsp://admin:password@192.168.1.50:554/stream"
                                        required
                                    />
                                </div>
                            )}

                            <div className="cyber-form-group">
                                <label className="cyber-form-label">Installation Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    className="cyber-form-input"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Factory Entrance Gate A"
                                    required
                                />
                            </div>

                            <div className="cyber-form-group checkbox-cyber-toggle">
                                <label className="cyber-switch">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                    />
                                    <span className="cyber-slider"></span>
                                </label>
                                <div className="checkbox-labels">
                                    <span className="chk-title">Enable Stream Node Immediately</span>
                                    <span className="chk-desc">Allow YOLOv8 model to pull frame structures right away.</span>
                                </div>
                            </div>

                            <div className="cyber-modal-footer">
                                <button type="button" className="btn-cyber-cancel" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-cyber-submit">{isEditing ? "Save Changes" : "Create Node"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraManagement;