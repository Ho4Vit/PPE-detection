import React, { useEffect, useRef, useState } from "react";

const DashboardTest = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const fileInputRef = useRef(null);

    // SỬA ĐỔI QUAN TRỌNG: Quản lý lịch sử box theo TRACK_ID thay vì CLASS_ID để tránh lỗi gộp box khi có nhiều người
    const trackBoxHistoryRef = useRef({});
    const MAX_HISTORY_FRAMES = 4; // Tăng lên 4 giúp box mượt hơn nữa khi ảnh đầu vào nét cao

    const [videoSource, setVideoSource] = useState("webcam");
    const [systemStatus, setSystemStatus] = useState("Safe");
    const [violations, setViolations] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [cameraId, setCameraId] = useState(1);
    const [selectedFileName, setSelectedFileName] = useState("");

    const CLASS_MAPPING = {
        0: { name: "Hardhat", color: "#00FF00" },
        1: { name: "Mask", color: "#00FF00" },
        2: { name: "No Hardhat", color: "#FF0000" },
        3: { name: "No Mask", color: "#FF0000" },
        4: { name: "No Safety Vest", color: "#FF0000" },
        5: { name: "Person", color: "#3399FF" },
        6: { name: "Safety Vest", color: "#00FF00" },
    };

    const stopCurrentVideoStream = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (videoRef.current) {
            videoRef.current.src = "";
        }
    };

    useEffect(() => {
        // ---- 1. SETUP LUỒNG VIDEO CAMERA ----
        if (videoSource === "webcam") {
            setSelectedFileName("");
            navigator.mediaDevices
                .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
                .then((stream) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch((err) => console.error("Không thể mở Webcam HD: ", err));
        }

        // ---- 2. THIẾT LẬP WEBSOCKET KẾT NỐI AI ----
        const wsUrl = `ws://localhost:8000/api/v1/ppe/ws?camera_id=${cameraId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            trackBoxHistoryRef.current = {};
        };
        ws.onclose = () => setIsConnected(false);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setSystemStatus(data.status);
            setViolations(data.current_violations);

            const newBoxes = data.boxes || [];

            // Làm sạch RAM: Xóa các vật thể đã đi ra khỏi camera dựa trên track_id
            const currentTrackIds = new Set(newBoxes.map(b => b.track_id || b.class_id));
            Object.keys(trackBoxHistoryRef.current).forEach(tid => {
                if (!currentTrackIds.has(parseInt(tid))) {
                    delete trackBoxHistoryRef.current[tid];
                }
            });

            // Ghi nhận dữ liệu tọa độ mới vào bộ đệm RAM
            newBoxes.forEach(box => {
                // Ưu tiên lấy track_id từ backend, nếu không có sẽ fallback về class_id
                const tid = box.track_id !== undefined ? box.track_id : box.class_id;

                if (!trackBoxHistoryRef.current[tid]) {
                    trackBoxHistoryRef.current[tid] = [];
                }
                trackBoxHistoryRef.current[tid].push({
                    bbox: box.bbox,
                    class_id: box.class_id,
                    confidence: box.confidence
                });

                if (trackBoxHistoryRef.current[tid].length > MAX_HISTORY_FRAMES) {
                    trackBoxHistoryRef.current[tid].shift();
                }
            });

            // Thực thi hàm vẽ ma trận co giãn
            drawSmoothedBoundingBoxes(newBoxes);
        };

        // ---- 3. VÒNG LẶP CHỤP HÌNH ẨN GỬI BYTE ẢNH GỐC SIÊU NÉT ----
        const intervalId = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN && videoRef.current) {
                const video = videoRef.current;

                if (video.readyState === video.HAVE_ENOUGH_DATA && !video.paused) {
                    // Dùng canvas hoàn toàn ẩn để cô lập kích thước, không đụng vào CSS giao diện
                    const offscreenCanvas = document.createElement("canvas");
                    const ctx = offscreenCanvas.getContext("2d");

                    // Lấy chính xác điểm ảnh thô của video gốc để AI nhận diện nhạy nhất
                    offscreenCanvas.width = video.videoWidth;
                    offscreenCanvas.height = video.videoHeight;

                    ctx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

                    // Gửi ảnh Lossless Chất lượng 1.0 không nén vỡ hình
                    offscreenCanvas.toBlob((blob) => {
                        if (blob) {
                            blob.arrayBuffer().then((buffer) => {
                                ws.send(buffer);
                            });
                        }
                    }, "image/jpeg", 1.0);
                }
            }
        }, 60); // Duy trì ~16 FPS để triệt tiêu vệt mờ chuyển động nhanh

        return () => {
            clearInterval(intervalId);
            ws.close();
            stopCurrentVideoStream();
        };
    }, [cameraId, videoSource]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            stopCurrentVideoStream();
            setSelectedFileName(file.name);
            const fileURL = URL.createObjectURL(file);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                videoRef.current.src = fileURL;
                videoRef.current.loop = true;
                videoRef.current.play().catch(err => console.log("Yêu cầu tương tác phát video"));
            }
        }
    };

    // HÀM VẼ FIXED: Đồng bộ hoàn hảo ma trận kích thước và tọa độ
    const drawSmoothedBoundingBoxes = (boxesInFrame) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || video.videoWidth === 0) return;

        const ctx = canvas.getContext("2d");

        // Khóa chặt kích thước Canvas vẽ trùng khít với pixel hiển thị thực tế của thẻ video
        const displayWidth = video.clientWidth;
        const displayHeight = video.clientHeight;

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const activeTrackIds = Object.keys(trackBoxHistoryRef.current);
        if (activeTrackIds.length === 0) return;

        // TÍNH TOÁN TỶ LỆ CO GIÃN CHUẨN XÁC GIỮA ẢNH GỐC VÀ MÀN HÌNH WEB hiển thị
        const scaleX = displayWidth / video.videoWidth;
        const scaleY = displayHeight / video.videoHeight;

        activeTrackIds.forEach((tidString) => {
            const tid = parseInt(tidString);
            const history = trackBoxHistoryRef.current[tid];
            if (history.length === 0) return;

            // Tính trung bình trượt tọa độ
            let sumX1 = 0, sumY1 = 0, sumX2 = 0, sumY2 = 0;
            history.forEach(item => {
                sumX1 += item.bbox[0]; sumY1 += item.bbox[1];
                sumX2 += item.bbox[2]; sumY2 += item.bbox[3];
            });

            const historyLength = history.length;
            const rawX1 = sumX1 / historyLength;
            const rawY1 = sumY1 / historyLength;
            const rawX2 = sumX2 / historyLength;
            const rawY2 = sumY2 / historyLength;

            // ĐỒNG BỘ CHUYỂN ĐỔI SANG TỌA ĐỘ HIỂN THỊ TRÊN CANVAS WEB
            const sx1 = rawX1 * scaleX;
            const sy1 = rawY1 * scaleY;
            const sx2 = rawX2 * scaleX;
            const sy2 = rawY2 * scaleY;

            // Lấy thông tin Class và độ tin cậy mới nhất của vật thể này
            const latestInfo = history[history.length - 1];
            const cid = latestInfo.class_id;
            const confidence = latestInfo.confidence;

            // Tiến hành vẽ Box lên màn hình
            const classInfo = CLASS_MAPPING[cid] || { name: `Vật thể`, color: "#FFFFFF" };
            ctx.strokeStyle = classInfo.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1);

            // Vẽ thẻ nhãn tên (Label)
            ctx.fillStyle = classInfo.color;
            ctx.font = "bold 13px Arial";
            const labelText = confidence
                ? `${classInfo.name} (${(confidence * 100).toFixed(0)}%)`
                : classInfo.name;

            const textWidth = ctx.measureText(labelText).width;

            // Vẽ nền nhãn cố định trên đầu box
            ctx.fillRect(sx1 - 1.5, sy1 - 20, textWidth + 8, 20);

            // Ghi text nhãn chữ đen nền màu tương phản cao
            ctx.fillStyle = "#000000";
            ctx.fillText(labelText, sx1 + 3, sy1 - 5);
        });
    };

    const styles = {
        container: { padding: "20px", backgroundColor: "#1e1e24", color: "#ffffff", fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", minHeight: "100vh" },
        header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #333", paddingBottom: "15px", marginBottom: "15px" },
        sourceSelectorCard: { backgroundColor: "#2a2a35", padding: "12px 20px", borderRadius: "10px", marginBottom: "20px", display: "flex", alignItems: "center", border: "1px solid #3a3a4a" },
        sourceBtn: (isActive) => ({ backgroundColor: isActive ? "#3b82f6" : "#4b5563", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginRight: "10px", transition: "background-color 0.2s" }),
        fileNameTag: { marginLeft: "15px", color: "#3b82f6", fontSize: "14px" },
        connectionBadge: (isConnected) => ({ backgroundColor: isConnected ? "#2e7d32" : "#c62828", color: "#fff", padding: "6px 12px", borderRadius: "20px", fontWeight: "bold", fontSize: "13px" }),
        mainLayout: { display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" },
        videoSection: { backgroundColor: "#0b0b0d", borderRadius: "12px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", padding: "10px" },
        videoWrapper: { position: "relative", width: "100%", maxWidth: "720px", display: "inline-block" },
        videoElement: { width: "100%", height: "auto", display: "block", objectFit: "contain" },
        canvasElement: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 },
        controlSection: { display: "flex", flexDirection: "column", gap: "20px" },
        statusCard: (status) => ({ backgroundColor: status === "Danger" ? "#7f1d1d" : "#14532d", border: `2px solid ${status === "Danger" ? "#ef4444" : "#22c55e"}`, borderRadius: "12px", padding: "25px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }),
        infoCard: { backgroundColor: "#2a2a35", borderRadius: "12px", padding: "20px", border: "1px solid #3a3a4a" },
        violationList: { paddingLeft: "20px", margin: "0" },
        violationItem: { marginBottom: "8px", fontSize: "15px" }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={{ margin: 0 }}>HỆ THỐNG GIÁM SÁT AN TOÀN LAO ĐỘNG (FIXED RENDER SCALE)</h2>
                <div style={styles.connectionBadge(isConnected)}>
                    {isConnected ? "● AI SERVER CONNECTED" : "○ AI SERVER DISCONNECTED"}
                </div>
            </div>

            <div style={styles.sourceSelectorCard}>
                <span style={{ fontWeight: "bold", marginRight: "15px" }}>CHỌN NGUỒN DỮ LIỆU:</span>
                <button style={styles.sourceBtn(videoSource === "webcam")} onClick={() => setVideoSource("webcam")}>📷 Luồng Webcam HD</button>
                <button style={styles.sourceBtn(videoSource === "file")} onClick={() => { setVideoSource("file"); setTimeout(() => fileInputRef.current?.click(), 100); }}>📁 Tải File Video Test</button>
                <input type="file" ref={fileInputRef} accept="video/*" style={{ display: "none" }} onChange={handleFileChange} />
                {selectedFileName && ( <span style={styles.fileNameTag}>🎞️ Đang chạy file: <b>{selectedFileName}</b></span> )}
            </div>

            <div style={styles.mainLayout}>
                <div style={styles.videoSection}>
                    <div style={styles.videoWrapper}>
                        <video ref={videoRef} autoPlay playsInline muted style={styles.videoElement} />
                        <canvas ref={canvasRef} style={styles.canvasElement} />
                    </div>
                </div>

                <div style={styles.controlSection}>
                    <div style={styles.statusCard(systemStatus)}>
                        <span style={{ fontSize: "16px", fontWeight: "bold" }}>TRẠNG THÁI HỆ THỐNG</span>
                        <h1 style={{ fontSize: "42px", margin: "10px 0 0 0", letterSpacing: "2px" }}> {systemStatus.toUpperCase()} </h1>
                    </div>
                    <div style={styles.infoCard}>
                        <h3>Danh sách vi phạm hiện thời (RAM Tracking):</h3>
                        {violations.length === 0 ? ( <p style={{ color: "#a0a0ab", fontStyle: "italic" }}>Không phát hiện vi phạm nào.</p> ) : (
                            <ul style={styles.violationList}>
                                {violations.map((v, index) => ( <li key={index} style={styles.violationItem}>⚠️ Trạng thái vi phạm: <strong style={{ color: "#FF3333" }}>{v}</strong></li> ))}
                            </ul>
                        )}
                    </div>
                    <div style={styles.infoCard}>
                        <h3>Thông số cấu hình:</h3>
                        <p>• Định dạng ảnh: <b>JPEG 1.0 thô gốc (Ngang Tkinter)</b>.</p>
                        <p>• Bộ đệm ma trận lọc: <b>Multi-Object Track ID Matrix</b>.</p>
                        <p>• Cảnh báo an toàn: <b>Kích hoạt sau 5 giây vi phạm liên tục</b>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTest;