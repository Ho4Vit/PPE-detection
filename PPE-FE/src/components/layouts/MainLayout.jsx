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
                <div style={styles.logo} onClick={() => navigate("/")} style={{...styles.logo, cursor: "pointer"}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
                    <span style={{ fontWeight: "bold", letterSpacing: "0.05em" }}>PPE DETECTOR</span>
                </div>

                <nav style={styles.navActions}>
                    <div style={styles.userProfileZone}>

                        {/* NÚT QUẢN LÝ CAMERA LUÔN HIỂN THỊ CÔNG KHAI */}
                        <button style={styles.btnDashboard} onClick={() => navigate("/camera-management")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                <circle cx="12" cy="13" r="4"/>
                            </svg>
                            Quản lý Camera
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
    userProfileZone: { display: "flex", alignItems: "center", gap: "16px" },
    btnDashboard: { display: "flex", alignItems: "center", padding: "6px 14px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", transition: "all 0.2s" },
    avatar: { width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" },
    username: { color: "#1e293b", fontSize: "14px", fontWeight: "600" },
    btnLogout: { padding: "6px 14px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", transition: "background 0.2s" },
    btnLogin: { padding: "8px 16px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
    mainContent: { flex: 1, display: "flex" },
    footer: { textAlign: "center", padding: "1.25rem", backgroundColor: "#1e293b", color: "#94a3b8", fontSize: "13px", borderTop: "1px solid #e2e8f0" }
};