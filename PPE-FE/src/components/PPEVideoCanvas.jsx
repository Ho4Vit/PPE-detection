import React, { useEffect, useRef } from "react";

// Định nghĩa nhãn nhận diện tương thích với YOLOv8 của hệ thống
const CLASS_MAPPING = {
    0: { name: "Hardhat", color: "#00FF00" },
    1: { name: "Mask", color: "#00FF00" },
    2: { name: "No Hardhat", color: "#FF0000" },
    3: { name: "No Mask", color: "#FF0000" },
    4: { name: "No Safety Vest", color: "#FF0000" },
    5: { name: "Person", color: "#3399FF" },
    6: { name: "Safety Vest", color: "#00FF00" },
};

const PPEVideoCanvas = ({ cameraId, videoSource, isCamOn, checkedRules, onStatusChange, onViolationsChange, onServerConnectionChange }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Sử dụng Ref để tránh re-render khi tọa độ bounding box cập nhật liên tục
    const latestBoxesRef = useRef([]);

    // Dọn sạch luồng camera phần cứng và bộ nhớ Canvas
    const stopCurrentVideoStream = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.src = "";
        }
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        latestBoxesRef.current = [];
    };

    const startWebcam = () => {
        navigator.mediaDevices
            .getUserMedia({ video: { width: 640, height: 360 }, audio: false })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(err => console.error("Lỗi phát luồng webcam:", err));
                }
            })
            .catch((err) => {
                console.error("Hệ thống bị chặn quyền truy cập hoặc thiếu phần cứng Camera:", err);
                onServerConnectionChange(false);
            });
    };

    // Quản lý trạng thái On/Off thiết bị ngoại vi phần cứng
    useEffect(() => {
        if (videoSource === "webcam" && isCamOn) {
            startWebcam();
        } else if (videoSource !== "file") {
            stopCurrentVideoStream();
        }
        return () => stopCurrentVideoStream();
    }, [videoSource, isCamOn]);

    // Vòng lặp đồng bộ xử lý đồ họa (Animation Frame Loop)
    useEffect(() => {
        const renderLoop = () => {
            drawRealtimeBoundingBoxes();
            animationFrameRef.current = requestAnimationFrame(renderLoop);
        };
        animationFrameRef.current = requestAnimationFrame(renderLoop);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    // TÍNH NĂNG NÂNG CẤP: Thiết lập WebSocket phục vụ đồng thời cho cả Webcam và File Video tải lên
    useEffect(() => {
        // Chặn kết nối nếu thiếu ID camera, hoặc sai nguồn cấu hình
        if (!cameraId || (videoSource !== "webcam" && videoSource !== "file") || (videoSource === "webcam" && !isCamOn)) {
            if (wsRef.current) wsRef.current.close();
            return;
        }

        const hardhatParam = checkedRules?.hardhat ? 1 : 0;
        const vestParam = checkedRules?.vest ? 1 : 0;
        const maskParam = checkedRules?.mask ? 1 : 0;

        const wsUrl = `ws://localhost:8000/api/v1/ppe/ws?camera_id=${cameraId}&hardhat=${hardhatParam}&vest=${vestParam}&mask=${maskParam}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            onServerConnectionChange(true);
            latestBoxesRef.current = [];
        };

        ws.onclose = () => {
            onServerConnectionChange(false);
            latestBoxesRef.current = [];
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onStatusChange(data.status);
            onViolationsChange(data.current_violations || []);
            latestBoxesRef.current = data.boxes || [];
        };

        // Gửi khung hình nhị phân lên AI Server định kỳ mỗi 50ms (~20 FPS) áp dụng cho cả Webcam và File
        const intervalId = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN && videoRef.current) {
                const video = videoRef.current;
                if (video.readyState === video.HAVE_ENOUGH_DATA && !video.paused) {
                    const offscreenCanvas = document.createElement("canvas");
                    const ctx = offscreenCanvas.getContext("2d");

                    offscreenCanvas.width = 640;
                    offscreenCanvas.height = 360;
                    ctx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

                    offscreenCanvas.toBlob((blob) => {
                        if (blob) {
                            blob.arrayBuffer().then((buffer) => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(buffer);
                                }
                            });
                        }
                    }, "image/jpeg", 0.4); // Nén chất lượng ảnh 40% để giảm tải băng thông WebSocket
                }
            }
        }, 50);

        return () => {
            clearInterval(intervalId);
            ws.close();
        };
    }, [cameraId, videoSource, isCamOn, checkedRules]);

    // Thuật toán vẽ đè tọa độ Bounding Box thời gian thực
    const drawRealtimeBoundingBoxes = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || video.videoWidth === 0 || video.paused) return;

        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();

        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        // Bước 1: Vẽ trực tiếp Frame nền của luồng video hiện tại
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Bước 2: Đồng bộ hóa ma trận tỷ lệ hiển thị giữa nguồn phát và Canvas UI
        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;

        // Bước 3: Đọc mảng tọa độ từ AI vẽ đè lên hình ảnh nền
        const currentBoxes = latestBoxesRef.current;
        if (!currentBoxes || currentBoxes.length === 0) return;

        currentBoxes.forEach((box) => {
            const sx1 = box.bbox[0] * scaleX;
            const sy1 = box.bbox[1] * scaleY;
            const sx2 = box.bbox[2] * scaleX;
            const sy2 = box.bbox[3] * scaleY;

            const classInfo = CLASS_MAPPING[box.class_id] || { name: "Object", color: "#FFFFFF" };

            // Vẽ đường viền khung hình chữ nhật bảo hộ
            ctx.strokeStyle = classInfo.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1);

            // Ghi nhãn Text tên lớp và tỷ lệ tự tin (%)
            ctx.fillStyle = classInfo.color;
            ctx.font = "bold 12px Arial";
            const labelText = `${classInfo.name} ${(box.confidence * 100).toFixed(0)}%`;
            const textWidth = ctx.measureText(labelText).width;

            // Đổ màu nền cho label chữ và ghi text chữ đen
            ctx.fillRect(sx1 - 1.5, sy1 - 18, textWidth + 6, 18);
            ctx.fillStyle = "#000000";
            ctx.fillText(labelText, sx1 + 2, sy1 - 5);
        });
    };

    // Lắng nghe tín hiệu nạp File video ngoại vi từ môi trường toàn cục (Global Window)
    useEffect(() => {
        window.loadVideoFileToCanvas = (fileURL) => {
            stopCurrentVideoStream();
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                videoRef.current.src = fileURL;
                videoRef.current.loop = true;
                videoRef.current.muted = true; // Mute để vượt qua cơ chế chặn Autoplay bảo mật của Chrome/Edge
                videoRef.current.play().catch(err => console.error("Lỗi khi mở luồng phát file video:", err));
            }
        };
    }, []);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#020617" }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ display: "none" }}
            />
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: isCamOn || videoSource === "file" ? "block" : "none",
                    borderRadius: "8px",
                    objectFit: "contain"
                }}
            />
        </div>
    );
};

export default PPEVideoCanvas;