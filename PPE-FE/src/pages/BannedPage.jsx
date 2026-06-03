import React from "react";
import { Link } from "react-router-dom";

export default function BannedPage() {
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.securityIcon}>⚠️</div>
                <span style={styles.techTag}>SECURITY BREACH / ACCESS DENIED</span>
                <h1 style={styles.title}>Tài Khoản Đã Bị Khóa</h1>

                <div style={styles.messageBox}>
                    <p>Hệ thống giám sát an toàn lao động <strong>PPE Detection</strong> ghi nhận tài khoản này hiện đang nằm trong trạng thái <strong>Ngừng hoạt động (Deactivated)</strong>.</p>
                    <p style={styles.subMessage}>Vui lòng liên hệ với bộ phận Quản trị viên (Administrator) hoặc phòng An toàn lao động để xác minh và kích hoạt lại quyền truy cập ma trận.</p>
                </div>

                <div style={styles.metaInfo}>
                    <span>Mã lỗi: AUTH_USER_DISABLED</span>
                    <span>Hệ thống: Microservices Gateway</span>
                </div>

                <Link to="/login" style={styles.btn}>
                    🔄 Quay Lại Đăng Nhập
                </Link>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#0f172a", // Tông tối đồng bộ hệ thống
        padding: "20px",
        fontFamily: "'Segoe UI', Roboto, sans-serif"
    },
    card: {
        maxWidth: "500px",
        width: "100%",
        background: "rgba(30, 41, 59, 0.7)",
        border: "1px solid rgba(239, 68, 68, 0.25)", // Viền đỏ cảnh báo
        borderRadius: "16px",
        padding: "2.5rem 2rem",
        textAlign: "center",
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.05)"
    },
    securityIcon: {
        fontSize: "50px",
        marginBottom: "10px",
        animation: "pulse 2s infinite"
    },
    techTag: {
        fontSize: "10px",
        fontWeight: "800",
        color: "#ef4444",
        letterSpacing: "2px",
        display: "block",
        marginBottom: "12px"
    },
    title: {
        fontSize: "24px",
        fontWeight: "900",
        color: "#ffffff",
        margin: "0 0 1.5rem 0",
        letterSpacing: "-0.5px"
    },
    messageBox: {
        background: "#0f172a",
        padding: "1.2rem",
        borderRadius: "10px",
        textAlign: "left",
        fontSize: "13.5px",
        color: "#cbd5e1",
        lineHeight: "1.6",
        borderLeft: "4px solid #ef4444"
    },
    subMessage: {
        marginTop: "10px",
        color: "#64748b",
        fontSize: "12.5px"
    },
    metaInfo: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "11px",
        color: "#475569",
        fontWeight: "700",
        margin: "1.5rem 0",
        textTransform: "uppercase"
    },
    btn: {
        display: "inline-block",
        width: "100%",
        boxSizing: "border-box",
        background: "#1e293b",
        border: "1px solid #334155",
        color: "#cbd5e1",
        padding: "0.8rem",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: "700",
        textDecoration: "none",
        transition: "all 0.2s ease",
        cursor: "pointer"
    }
};

// Khởi tạo animation nhấp nháy đỏ bảo mật cho icon
if (typeof document !== "undefined" && document.styleSheets.length > 0) {
    const sheet = document.styleSheets[0];
    try {
        sheet.insertRule(`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.6; } }`, sheet.cssRules.length);
    } catch (e) {}
}