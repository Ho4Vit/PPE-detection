import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function MainLayout() {
    const { user: contextUser, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const savedUser = JSON.parse(localStorage.getItem("ppe_user") || "null");
    const user = contextUser || savedUser;

    const formatUsername = (name) => {
        if (!name) return "NGƯỜI+DÙNG";
        return name.trim().toUpperCase().split(/\s+/).reverse().join("+");
    };

    return (
        <div style={styles.layoutWrapper}>
            {/* HEADER SYSTEM */}
            <header style={styles.header}>
                {/* 🟢 Đã sửa gộp 2 thuộc tính style viết trùng nhau ở logo */}
                <div onClick={() => navigate("/")} style={{...styles.logo, cursor: "pointer"}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
                    <span style={{ fontWeight: "bold", letterSpacing: "0.05em" }}>PPE DETECTOR</span>
                </div>

                <nav style={styles.navActions}>
                    <div style={styles.userProfileZone}>

                        {/* NÚT 1: GIÁM SÁT REALTIME AI */}
                        <button style={styles.btnDetect} onClick={() => navigate("/detect")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <path d="M23 7a2 2 0 0 0-2-2h-4.18A3 3 0 0 0 14 3h-4a3 3 0 0 0-2.82 2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7Z"/>
                                <circle cx="12" cy="13" r="3"/>
                            </svg>
                            Giám Sát AI
                        </button>

                        {/* NÚT 2: QUẢN LÝ CAMERA KHẢ DỤNG */}
                        <button style={styles.btnDashboard} onClick={() => navigate("/camera-management")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                <circle cx="12" cy="13" r="4"/>
                            </svg>
                            Quản lý Camera
                        </button>

                        {/* 🟢 NÚT 3 MỚI: ĐIỀU HƯỚNG SANG TRANG XEM BẢNG VI PHẠM */}
                        <button style={styles.btnViolations} onClick={() => navigate("/violations")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                            Nhật Ký Vi Phạm
                        </button>

                        {/* PHÂN VÙNG AUTHENTICATION PHÍA SAU NÚT */}
                        {(isAuthenticated || user) ? (
                            <>
                                <img
                                    src={user?.avatarUrl || "https://www.w3schools.com/howto/img_avatar.png"}
                                    alt="User Avatar"
                                    style={styles.avatar}
                                    onError={(e) => { e.target.src = "https://www.w3schools.com/howto/img_avatar.png"; }}
                                />
                                <span style={styles.username}>
                                    {formatUsername(user?.fullName || user?.name)}
                                </span>
                                <button style={styles.btnLogout} onClick={logout}>
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <button style={styles.btnLogin} onClick={() => navigate("/login")}>
                                Đăng Nhập
                            </button>
                        )}
                    </div>
                </nav>
            </header>

            {/* MAIN CONTENT REGION */}
            <main style={styles.mainContent}>
                <Outlet />
            </main>

            {/* FOOTER SYSTEM */}
            <footer style={styles.footer}>
                <p>© 2026 PPE Detection System - Hệ thống giám sát an toàn lao động bằng Computer Vision.</p>
                <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>Trường Đại học Giao thông vận tải TP.HCM</p>
            </footer>
        </div>
    );
}

const styles = {
    layoutWrapper: { display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f8fafc" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 2rem", backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 1000 },
    logo: { display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontSize: "16px", fontWeight: "bold" },
    navActions: { display: "flex", alignItems: "center" },
    userProfileZone: { display: "flex", alignItems: "center", gap: "12px" }, // Thu hẹp khoảng cách một chút cho vừa 3 nút
    btnDashboard: { display: "flex", alignItems: "center", padding: "6px 14px", backgroundColor: "#0284c7", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", transition: "all 0.2s" },
    // 🟢 Style bổ sung cho nút Giám Sát AI
    btnDetect: { display: "flex", alignItems: "center", padding: "6px 14px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", transition: "all 0.2s" },
    // 🟢 Style bổ sung cho nút Nhật Ký Vi Phạm màu cam đậm/đỏ cam để cảnh báo trực quan
    btnViolations: { display: "flex", alignItems: "center", padding: "6px 14px", backgroundColor: "#ea580c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", transition: "all 0.2s" },
    avatar: { width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" },
    username: { color: "#1e293b", fontSize: "14px", fontWeight: "600" },
    btnLogout: { padding: "6px 14px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", transition: "background 0.2s" },
    btnLogin: { padding: "8px 16px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
    mainContent: { flex: 1, display: "flex" },
    footer: { textAlign: "center", padding: "1.25rem", backgroundColor: "#1e293b", color: "#94a3b8", fontSize: "13px", borderTop: "1px solid #e2e8f0" }
};