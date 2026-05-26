import React, { useEffect, useRef } from "react";

const CLASS_MAPPING = {
    0: { name: "Hardhat", color: "#00FF00" },
    1: { name: "Mask", color: "#00FF00" },
    2: { name: "No Hardhat", color: "#FF0000" },
    3: { name: "No Mask", color: "#FF0000" },
    4: { name: "No Safety Vest", color: "#FF0000" },
    5: { name: "Person", color: "#3399FF" },
    6: { name: "Safety Vest", color: "#00FF00" },
};

const PPEVideoCanvas = ({ cameraId, videoSource, isCamOn, onStatusChange, onViolationsChange, onServerConnectionChange }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Lưu trữ danh sách bounding box mới nhất nhận được trực tiếp từ AI Server
    const latestBoxesRef = useRef([]);

    // Dập luồng phần cứng camera và dọn sạch bề mặt canvas
    const stopCurrentVideoStream = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (videoRef.current) videoRef.current.src = "";
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        latestBoxesRef.current = [];
    };

    // Khởi động Camera vật lý theo chuẩn tỷ lệ 16:9 để khớp giao diện web hiển thị
    const startWebcam = () => {
        navigator.mediaDevices
            .getUserMedia({ video: { width: 640, height: 360 }, audio: false })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(err => console.error("Lỗi gọi play() video:", err));
                }
            })
            .catch((err) => {
                console.error("Hệ thống bị chặn quyền hoặc thiếu thiết bị Camera:", err);
                onServerConnectionChange(false);
            });
    };

    // Theo dõi trạng thái đóng/mở vật lý của thiết bị đầu vào
    useEffect(() => {
        if (videoSource === "webcam" && isCamOn) {
            startWebcam();
        } else {
            stopCurrentVideoStream();
        }
        return () => stopCurrentVideoStream();
    }, [videoSource, isCamOn]);

    // Vòng lặp Render hình ảnh đồng bộ liên tục bằng phần cứng màn hình (60 FPS)
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

    // Quản lý cổng kết nối mạng WebSocket truyền tải luồng AI
    useEffect(() => {
        if (!cameraId || videoSource !== "webcam" || !isCamOn) {
            if (wsRef.current) wsRef.current.close();
            return;
        }

        const wsUrl = `ws://localhost:8000/api/v1/ppe/ws?camera_id=${cameraId}`;
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

            // Tiếp nhận dữ liệu tọa độ mới nhất để canvas render đè lên frame nền ngay lập tức
            latestBoxesRef.current = data.boxes || [];
        };

        // Gửi khung hình lên Server với chu kỳ 50ms (~20 FPS) để tối ưu băng thông mạng và giảm trễ tích tụ
        const intervalId = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN && videoRef.current) {
                const video = videoRef.current;
                if (video.readyState === video.HAVE_ENOUGH_DATA && !video.paused) {
                    const offscreenCanvas = document.createElement("canvas");
                    const ctx = offscreenCanvas.getContext("2d");

                    // Khởi tạo kích thước ảnh gửi lên trùng khớp hoàn toàn với tỉ lệ camera gốc
                    offscreenCanvas.width = 640;
                    offscreenCanvas.height = 360;
                    ctx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

                    offscreenCanvas.toBlob((blob) => {
                        if (blob) {
                            blob.arrayBuffer().then((buffer) => ws.send(buffer));
                        }
                    }, "image/jpeg", 0.4); // Chất lượng nén 40% tối ưu dung lượng file truyền trên đường truyền mạng
                }
            }
        }, 50); // 50ms mang lại độ mượt lý tưởng, triệt tiêu áp lực xếp hàng frame tại mạng Socket

        return () => {
            clearInterval(intervalId);
            ws.close();
        };
    }, [cameraId, videoSource, isCamOn]);

    // Hàm đồng bộ vẽ hình ảnh nền kết hợp tọa độ nhận diện thô từ AI
    const drawRealtimeBoundingBoxes = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || video.videoWidth === 0 || video.paused) return;

        const ctx = canvas.getContext("2d");

        // Tính toán lại kích thước khung canvas hiển thị thực tế trên giao diện để tránh biến dạng ảnh
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        // Bước 1: Vẽ trực tiếp frame hiện tại của video vật lý lên canvas làm ảnh nền
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Bước 2: Tính tỷ lệ co giãn (Scale factor) giữa video luồng vào và canvas UI đầu ra
        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;

        // Bước 3: Đọc trực tiếp tọa độ thực tế từ AI Server gửi về vẽ đè lên hình ảnh
        const currentBoxes = latestBoxesRef.current;
        if (!currentBoxes || currentBoxes.length === 0) return;

        currentBoxes.forEach((box) => {
            // Chuyển đổi tọa độ từ hệ quy chiếu ảnh thô sang hệ quy chiếu hiển thị thực tế ngoài CSS
            const sx1 = box.bbox[0] * scaleX;
            const sy1 = box.bbox[1] * scaleY;
            const sx2 = box.bbox[2] * scaleX;
            const sy2 = box.bbox[3] * scaleY;

            const classInfo = CLASS_MAPPING[box.class_id] || { name: "Object", color: "#FFFFFF" };

            // Thực hiện vẽ viền bao quanh vật thể nhận diện (Bounding box viền dày 3px)
            ctx.strokeStyle = classInfo.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1);

            // Cấu hình phông nền và chữ thông tin Nhãn nhắm chọn
            ctx.fillStyle = classInfo.color;
            ctx.font = "bold 12px Arial";
            const labelText = `${classInfo.name} ${(box.confidence * 100).toFixed(0)}%`;
            const textWidth = ctx.measureText(labelText).width;

            // Đổ nền hộp tiêu đề và vẽ văn bản chữ đen lên trên góc trái hộp bảo hộ
            ctx.fillRect(sx1 - 1.5, sy1 - 18, textWidth + 6, 18);
            ctx.fillStyle = "#000000";
            ctx.fillText(labelText, sx1 + 2, sy1 - 5);
        });
    };

    // Nhận tín hiệu xử lý video từ file ngoại vi
    useEffect(() => {
        window.loadVideoFileToCanvas = (fileURL) => {
            stopCurrentVideoStream();
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                videoRef.current.src = fileURL;
                videoRef.current.loop = true;
                videoRef.current.play().catch(err => console.error("Lỗi khi mở file video:", err));
            }
        };
    }, []);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#020617" }}>
            {/* Thẻ video chạy luồng ngầm để mượn phần cứng xử lý hình ảnh */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ display: "none" }}
            />
            {/* Canvas duy nhất hiển thị ra UI - Ép tỉ lệ contain bảo vệ nguyên gốc góc ảnh tỉ lệ 16:9 không bị lệch cắt biên */}
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