import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LoginSuccessPage = () => {
    const { loginWithCookie } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Kiểm tra xem URL trả về có chứa ?status=success hay không
        const status = searchParams.get("status");

        if (status === "success") {
            // Kích hoạt bóc tách dữ liệu từ Cookie để đẩy vào React State
            loginWithCookie()
                .then(() => {
                    // Xóa sạch chuỗi "?status=success" trên thanh địa chỉ URL cho an toàn bảo mật
                    window.history.replaceState({}, document.title, window.location.pathname);

                    // Đưa người dùng vào khu vực quản lý làm việc (Dashboard)
                    navigate("/dashboard");
                })
                .catch((err) => {
                    console.error("Lỗi đồng bộ Cookie:", err);
                    navigate("/login");
                });
        } else {
            // Nếu không có trạng thái success hợp lệ, đẩy ngược lại trang đăng nhập
            navigate("/login");
        }
    }, [searchParams, loginWithCookie, navigate]);

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
    container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#0f172a" },
    loaderBox: { textAlign: "center" },
    spinner: { margin: "0 auto 20px auto", width: "40px", height: "40px", border: "4px solid #334155", borderTop: "4px solid #38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite" },
    text: { fontSize: "20px", color: "#38bdf8", marginBottom: "6px", fontWeight: "bold" },
    subtext: { fontSize: "14px", color: "#94a3b8" }
};

// Inject hiệu ứng xoay cho Spinner
if (typeof document !== "undefined" && document.styleSheets.length > 0) {
    const styleSheet = document.styleSheets[0];
    try {
        styleSheet.insertRule(`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`, styleSheet.cssRules.length);
    } catch (e) {}
}

export default LoginSuccessPage;