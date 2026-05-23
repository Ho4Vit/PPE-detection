import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LoginSuccessPage = () => {
    const { loginWithCookie } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // 🌟 Biến cờ (flag) dùng để chặn gọi API trùng lặp trong React 18 StrictMode
    const isProcessing = useRef(false);

    useEffect(() => {
        const status = searchParams.get("status");

        if (status === "success") {
            // Nếu đang trong quá trình đồng bộ thì bỏ qua, không chạy lại nữa
            if (isProcessing.current) return;
            isProcessing.current = true;

            // Kích hoạt bóc tách dữ liệu từ Cookie để đẩy vào React State
            loginWithCookie()
                .then(() => {
                    // Xóa sạch chuỗi "?status=success" trên thanh địa chỉ URL cho an toàn bảo mật
                    window.history.replaceState({}, document.title, window.location.pathname);

                    // Điều hướng người dùng về trang chủ (HomePage) [cite: Dự án là Hệ thống giám sát an toàn lao động (PPE Detection). Kiến trúc bao gồm Microservices với Frontend (ReactJS), API Gateway (Spring Cloud Gateway), Service Discovery (Eureka Server), Backend (Java Spring Boot), AI Service (Python, YOLOv8 nhận diện Người, Helmet, Vest, Shoes từ webcam). Kịch bản demo là đội mũ bảo hộ hiện khung xanh "Safe", bỏ mũ ra hiện khung đỏ "Danger". Quy tắc đặc biệt là chỉ kích hoạt cảnh báo Unsafe nếu vi phạm liên tục quá 5 giây và không lưu file ảnh cắt vi phạm, chỉ ghi log và xuất thống kê ra file Excel.]
                    navigate("/");
                })
                .catch((err) => {
                    console.error("Lỗi đồng bộ Cookie:", err);
                    navigate("/login");
                });
        } else {
            // Nếu không có trạng thái success hợp lệ, đẩy ngược lại trang đăng nhập
            navigate("/login");
        }

        // 🌟 ĐÃ SỬA: Loại bỏ loginWithCookie khỏi danh sách phụ thuộc để chặn đứng loop
    }, [searchParams, navigate]);

    return (
        <div style={styles.container}>
            <div style={styles.loaderBox}>
                <div style={styles.spinner}></div>
                <h2 style={styles.text}>Đăng nhập thành công!</h2>
                <p style={styles.subtext}>Đang đồng bộ cấu hình phiên làm việc bảo mật bảo hộ PPE...</p>
            </div>
        </div>
    );
};

// 🎨 Giữ nguyên thiết kế tông màu Xanh lá cây (Green) đồng bộ hệ thống PPE
const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f0fdf4"
    },
    loaderBox: {
        textAlign: "center",
        padding: "2rem",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)"
    },
    spinner: {
        margin: "0 auto 20px auto",
        width: "40px",
        height: "40px",
        border: "4px solid #e5e7eb",
        borderTop: "4px solid #22c55e",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
    },
    text: {
        fontSize: "20px",
        color: "#14532d",
        marginBottom: "6px",
        fontWeight: "bold"
    },
    subtext: {
        fontSize: "14px",
        color: "#6b7280"
    }
};

// Inject hiệu ứng xoay cho Spinner
if (typeof document !== "undefined" && document.styleSheets.length > 0) {
    const styleSheet = document.styleSheets[0];
    try {
        styleSheet.insertRule(`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`, styleSheet.cssRules.length);
    } catch (e) {}
}

export default LoginSuccessPage;