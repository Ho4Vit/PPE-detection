import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LoginSuccessPage = () => {
    const { loginWithCookie } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isProcessing = useRef(false);

    useEffect(() => {
        const status = searchParams.get("status");
        const error = searchParams.get("error");

        // ⚠️ 1. PHÁT HIỆN TÀI KHOẢN BỊ KHÓA (active = false) TỪ BACKEND
        if (error === "disabled") {
            navigate("/banned", { replace: true });
            return;
        }

        // 🟢 2. XỬ LÝ ĐĂNG NHẬP THÀNH CÔNG
        if (status === "success") {
            if (isProcessing.current) return;
            isProcessing.current = true;

            loginWithCookie()
                .then(() => {
                    window.history.replaceState({}, document.title, window.location.pathname);

                    const savedUserStr = localStorage.getItem("ppe_user");
                    if (savedUserStr) {
                        const parsedUser = JSON.parse(savedUserStr);
                        const role = parsedUser.role?.toUpperCase();

                        if (role === "ADMIN" || role === "ROLE_ADMIN") {
                            navigate("/admin", { replace: true });
                            return;
                        }
                    }

                    navigate("/", { replace: true });
                })
                .catch((err) => {
                    console.error("Lỗi đồng bộ Cookie:", err);
                    navigate("/login", { replace: true });
                });
        } else {
            // Trường hợp URL không có tham số hợp lệ
            navigate("/login", { replace: true });
        }
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

if (typeof document !== "undefined" && document.styleSheets.length > 0) {
    const styleSheet = document.styleSheets[0];
    try {
        styleSheet.insertRule(`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`, styleSheet.cssRules.length);
    } catch (e) {}
}

export default LoginSuccessPage;