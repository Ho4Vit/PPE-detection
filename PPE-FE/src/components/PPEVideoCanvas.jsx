import React, { useEffect, useRef } from "react";

// Ánh xạ nhãn nhận diện tương thích lớp YOLOv8
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
    const latestBoxesRef = useRef([]);

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
                    videoRef.current.play().catch(err => console.error("Error webcam play:", err));
                }
            })
            .catch((err) => {
                console.error("Camera access denied:", err);
                onServerConnectionChange(false);
            });
    };

    useEffect(() => {
        if (videoSource === "webcam" && isCamOn) {
            startWebcam();
        } else if (videoSource !== "file") {
            stopCurrentVideoStream();
        }
        return () => stopCurrentVideoStream();
    }, [videoSource, isCamOn]);

    useEffect(() => {
        const renderLoop = () => {
            drawRealtimeBoundingBoxes();
            animationFrameRef.current = requestAnimationFrame(renderLoop);
        };
        animationFrameRef.current = requestAnimationFrame(renderLoop);
        return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }, []);

    useEffect(() => {
        if (!cameraId || (videoSource !== "webcam" && videoSource !== "file") || (videoSource === "webcam" && !isCamOn)) {
            if (wsRef.current) wsRef.current.close();
            return;
        }

        const hardhatParam = checkedRules?.hardhat ? 1 : 0;
        const vestParam = checkedRules?.vest ? 1 : 0;
        const maskParam = checkedRules?.mask ? 1 : 0;

        // Gọi đồng nhất qua cổng 80 của Nginx thông qua tiền tố /ws/
        const wsUrl = `ws://localhost/ws/ppe/ws?camera_id=${cameraId}&hardhat=${hardhatParam}&vest=${vestParam}&mask=${maskParam}`;
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

        const intervalId = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN && videoRef.current) {
                const video = videoRef.current;
                if (!video.paused && video.videoWidth > 0) {
                    const offscreenCanvas = document.createElement("canvas");
                    const ctx = offscreenCanvas.getContext("2d");

                    offscreenCanvas.width = 640;
                    offscreenCanvas.height = 360;
                    ctx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

                    offscreenCanvas.toBlob((blob) => {
                        if (blob && ws.readyState === WebSocket.OPEN) {
                            blob.arrayBuffer().then((buffer) => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(buffer);
                                }
                            });
                        }
                    }, "image/jpeg", 0.5);
                }
            }
        }, 50);

        return () => { clearInterval(intervalId); ws.close(); };
    }, [cameraId, videoSource, isCamOn, checkedRules]);

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

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;

        const currentBoxes = latestBoxesRef.current;
        if (!currentBoxes || currentBoxes.length === 0) return;

        currentBoxes.forEach((box) => {
            const sx1 = box.bbox[0] * scaleX;
            const sy1 = box.bbox[1] * scaleY;
            const sx2 = box.bbox[2] * scaleX;
            const sy2 = box.bbox[3] * scaleY;

            const classInfo = CLASS_MAPPING[box.class_id] || { name: "Object", color: "#FFFFFF" };

            ctx.strokeStyle = classInfo.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1);

            ctx.fillStyle = classInfo.color;
            ctx.font = "bold 12px Arial";
            const labelText = `${classInfo.name} ${(box.confidence * 100).toFixed(0)}%`;
            const textWidth = ctx.measureText(labelText).width;

            ctx.fillRect(sx1 - 1.5, sy1 - 18, textWidth + 6, 18);
            ctx.fillStyle = "#000000";
            ctx.fillText(labelText, sx1 + 2, sy1 - 5);
        });
    };

    useEffect(() => {
        window.loadVideoFileToCanvas = (fileURL) => {
            stopCurrentVideoStream();
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                videoRef.current.src = fileURL;
                videoRef.current.loop = true;
                videoRef.current.muted = true;
                videoRef.current.play().catch(err => console.error("File play error:", err));
            }
        };
    }, []);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#020617" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: isCamOn || videoSource === "file" ? "block" : "none", borderRadius: "8px", objectFit: "contain" }} />
        </div>
    );
};

export default PPEVideoCanvas;