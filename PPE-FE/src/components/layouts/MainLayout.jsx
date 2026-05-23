import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function MainLayout() {
    const { user: contextUser, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    // Lấy dữ liệu từ Context hoặc LocalStorage làm phương án dự phòng khi F5 trang
    const savedUser = JSON.parse(localStorage.getItem("ppe_user") || "null");
    const user = contextUser || savedUser;

    console.log("Dữ liệu người dùng thực tế hiển thị trong Layout:", user);

    // Hàm xử lý đảo ngược chuỗi họ tên và nối với nhau bằng dấu "+"
    const formatUsername = (name) => {
        if (!name) return "NGƯỜI+DÙNG";
        // Tách từ chuỗi "An Hòa Lê" thành mảng -> đảo ngược thành "Lê Hòa An" -> viết hoa và nối bằng dấu "+"
        return name.trim().toUpperCase().split(/\s+/).reverse().join("+");
    };

    return (
        <div style={styles.layoutWrapper}>
            {/* HEADER SYSTEM */}
            <header style={styles.header}>
                <div style={styles.logo} onClick={() => navigate("/")}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
                    <span style={{ fontWeight: "bold", trackingHeight: "wider" }}>PPE DETECTOR</span>
                </div>

                <nav style={styles.navActions}>
                    {(isAuthenticated || user) ? (
                        <div style={styles.userProfileZone}>
                            {/* Hiển thị Avatar */}
                            <img
                                src={user?.avatarUrl || "https://www.w3schools.com/howto/img_avatar.png"}
                                alt="User Avatar"
                                style={styles.avatar}
                                onError={(e) => {
                                    e.target.src = "https://www.w3schools.com/howto/img_avatar.png";
                                }}
                            />

                            {/* Hiển thị Tên người dùng đã được định dạng đảo chữ chuẩn tiếng Việt */}
                            <span style={styles.username}>
                                {formatUsername(user?.fullName)}
                            </span>

                            {/* Nút Đăng xuất */}
                            <button style={styles.btnLogout} onClick={logout}>
                                Đăng xuất
                            </button>
                        </div>
                    ) : (
                        <button style={styles.btnLogin} onClick={() => navigate("/login")}>
                            Đăng Nhập
                        </button>
                    )}
                </nav>
            </header>

            {/* MAIN CONTENT REGION */}
            <main style={styles.mainContent}>
                <Outlet />
            </main>

            {/* FOOTER SYSTEM */}
            <footer style={styles.footer}>
                <p>© 2026 PPE Detection System - Hệ thống giám sát an toàn lao động bằng Computer Vision. [cite: Dự án là Hệ thống giám sát an toàn lao động (PPE Detection). Kiến trúc bao gồm Microservices với Frontend (ReactJS), API Gateway (Spring Cloud Gateway), Service Discovery (Eureka Server), Backend (Java Spring Boot), AI Service (Python, YOLOv8 nhận diện Người, Helmet, Vest, Shoes từ webcam). Kịch bản demo là đội mũ bảo hộ hiện khung xanh "Safe", bỏ mũ ra hiện khung đỏ "Danger". Quy tắc đặc biệt là chỉ kích hoạt cảnh báo Unsafe nếu vi phạm liên tục quá 5 giây và không lưu file ảnh cắt vi phạm, chỉ ghi log và xuất thống kê ra file Excel.]</p>
                <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>Trường Đại học Giao thông vận tải TP.HCM</p>
            </footer>
        </div>
    );
}

const styles = {
    layoutWrapper: { display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f8fafc" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 2rem", backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 1000 },
    logo: { display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", cursor: "pointer", fontSize: "16px", fontWeight: "bold" },
    navActions: { display: "flex", alignItems: "center" },
    userProfileZone: { display: "flex", alignItems: "center", gap: "12px" },
    avatar: { width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" },
    username: { color: "#1e293b", fontSize: "14px", fontWeight: "600" },
    btnLogout: { padding: "6px 14px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", transition: "background 0.2s" },
    btnLogin: { padding: "8px 16px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
    mainContent: { flex: 1, display: "flex" },
    footer: { textAlign: "center", padding: "1.25rem", backgroundColor: "#1e293b", color: "#94a3b8", fontSize: "13px", borderTop: "1px solid #e2e8f0" }
};