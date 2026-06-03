import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function MainLayout() {
    const { user: contextUser, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const savedUser = JSON.parse(localStorage.getItem("ppe_user") || "null");
    const user = contextUser || savedUser;

    const [systemStatus, setSystemStatus] = useState("Safe");
    const [isFlashActive, setIsFlashActive] = useState(false);

    // 🔴 HÀM TẠO ÂM THANH CÒI HÚ KÉP (INDUSTRIAL SIREN) NGUY HIỂM
    const playDangerSirenSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();

            // Tạo 2 bộ dao động âm thanh chạy lệch pha để tạo tiếng còi hú kép
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc1.type = "sawtooth"; // Sóng răng cưa tạo độ sắc bén, gắt của còi báo động
            osc2.type = "sine";

            // Tần số còi hú công nghiệp cao
            osc1.frequency.setValueAtTime(880, ctx.currentTime); // Nốt La (A5)
            osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // Nốt Mi (E5)

            // Điều chỉnh âm lượng vừa vặn nhưng đủ gắt để báo động (8%)
            gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc1.start();
            osc2.start();

            osc1.stop(ctx.currentTime + 0.4);
            osc2.stop(ctx.currentTime + 0.4);
        } catch (e) {
            console.log("Audio play blocked by browser autoplay policy.");
        }
    };

    // Theo dõi trạng thái hệ thống để điều khiển còi hú dồn dập
    useEffect(() => {
        let alertInterval = null;

        if (systemStatus.toLowerCase() === "danger") {
            setIsFlashActive(true);
            playDangerSirenSound();

            // Cứ mỗi 0.6 giây hú một lần (tạo nhịp dồn dập, nguy hiểm)
            alertInterval = setInterval(() => {
                playDangerSirenSound();
            }, 600);
        } else {
            setIsFlashActive(false);
        }

        return () => {
            if (alertInterval) clearInterval(alertInterval);
        };
    }, [systemStatus]);

    const formatUsername = (name) => {
        if (!name) return "OPERATOR";
        return name.replace(/\+/g, " ").trim().toUpperCase();
    };

    return (
        <div style={styles.layoutWrapper}>
            {/* LỚP PHỦ CẢNH BÁO NGUY HIỂM CHỚP NHÁY TOÀN MÀN HÌNH */}
            <div style={{
                ...styles.dangerOverlay,
                opacity: isFlashActive ? 0.3 : 0,
                animation: isFlashActive ? "industrial-siren-flash 0.6s infinite ease-in-out" : "none",
                pointerEvents: "none"
            }}></div>

            <style>{`
                @keyframes industrial-siren-flash {
                    0% { box-shadow: inset 0 0 40px rgba(239, 68, 68, 0); background-color: rgba(239, 68, 68, 0); }
                    50% { box-shadow: inset 0 0 120px rgba(239, 68, 68, 0.8); background-color: rgba(239, 68, 68, 0.2); }
                    100% { box-shadow: inset 0 0 40px rgba(239, 68, 68, 0); background-color: rgba(239, 68, 68, 0); }
                }
            `}</style>

            <div style={styles.cyberGrid}></div>

            {/* HEADER */}
            <header style={styles.header}>
                <div onClick={() => navigate("/")} style={styles.logo}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isFlashActive ? "#ef4444" : "#16a34a"} strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
                    </svg>
                    <span style={{...styles.logoText, color: isFlashActive ? "#ef4444" : COLORS.textDark}}>PPE DETECTION SYSTEM</span>
                </div>

                <nav style={styles.navActions}>
                    <div style={styles.userProfileZone}>
                        <button style={{...styles.navBtn, ...(location.pathname === "/detect" ? styles.navBtnActive : {})}} onClick={() => navigate("/detect")}>Live Monitor</button>
                        <button style={{...styles.navBtn, ...(location.pathname === "/camera-management" ? styles.navBtnActive : {})}} onClick={() => navigate("/camera-management")}>Camera Management</button>
                        <button style={{...styles.navBtn, ...(location.pathname === "/violations" ? styles.navBtnActive : {})}} onClick={() => navigate("/violations")}>Violations Log</button>
                        <div style={styles.headerDivider}></div>
                        {(isAuthenticated || user) ? (
                            <>
                                <div style={styles.userInfoWrapper}>
                                    <span style={styles.username}>{formatUsername(user?.fullName || user?.name)}</span>
                                    <span style={styles.roleTag}>SYSTEM OPERATOR</span>
                                </div>
                                <img src={user?.avatarUrl || "https://www.w3schools.com/howto/img_avatar.png"} alt="Avatar" style={styles.avatar} />
                                <button style={styles.btnLogout} onClick={logout}>Logout</button>
                            </>
                        ) : (
                            <button style={styles.btnLogin} onClick={() => navigate("/login")}>Sign In</button>
                        )}
                    </div>
                </nav>
            </header>

            {/* MAIN */}
            <main style={styles.mainContent}>
                {/* Đẩy cả trạng thái nhấp nháy xuống các component con */}
                <Outlet context={{ setSystemStatus, systemStatus, isFlashActive }} />
            </main>

            {/* FOOTER */}
            <footer style={styles.footer}>
                <div style={styles.footerContainer}>
                    <div style={styles.footerCol}>
                        <h4 style={styles.footerHeadingMain}>PPE CORE MATRIX</h4>
                        <p style={styles.footerText}>Hệ thống giám sát an toàn lao động áp dụng công nghệ trí tuệ nhân tạo nhận diện trang bị bảo hộ tự động.</p>
                    </div>
                    <div style={styles.footerCol}>
                        <h4 style={styles.footerHeading}>SYSTEM ARCHITECTURE</h4>
                        <span style={styles.footerLink}>AI Inference Stream (YOLOv8)</span>
                    </div>
                    <div style={styles.footerCol}>
                        <h4 style={styles.footerHeading}>LEGAL & SECURITY</h4>
                        <span style={styles.footerLink}>Privacy Policy & Data Security</span>
                    </div>
                    <div style={styles.footerCol}>
                        <h4 style={styles.footerHeading}>DEVELOPMENT BASIS</h4>
                        <p style={styles.institutionName}>Trường Đại học Giao thông vận tải TP.HCM</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const COLORS = { headerBg: "#ffffff", headerBorder: "#e2e8f0", mainBg: "#090d16", footerBg: "#0f172a", textDark: "#1e293b", textLight: "#f8fafc", brandGreen: "#16a34a" };
const styles = {
    layoutWrapper: { display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: COLORS.mainBg, position: "relative", overflowX: "hidden" },
    dangerOverlay: { position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 9999, mixBlendMode: "hard-light", transition: "opacity 0.15s ease" },
    cyberGrid: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.01) 1px, transparent 0)", backgroundSize: "24px 24px", pointerEvents: "none", zIndex: 1 },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 2.5rem", backgroundColor: COLORS.headerBg, borderBottom: `1px solid ${COLORS.headerBorder}`, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", position: "sticky", top: 0, zIndex: 1000 },
    logo: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
    logoText: { fontSize: "14.5px", fontWeight: "800", letterSpacing: "1px" },
    navActions: { display: "flex", alignItems: "center" },
    userProfileZone: { display: "flex", alignItems: "center", gap: "0.6rem" },
    navBtn: { display: "flex", alignItems: "center", padding: "0.5rem 1rem", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" },
    navBtnActive: { color: "#ffffff", backgroundColor: COLORS.brandGreen, borderColor: COLORS.brandGreen },
    headerDivider: { width: "1px", height: "18px", backgroundColor: "#cbd5e1", margin: "0 0.4rem" },
    userInfoWrapper: { display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: "4px" },
    username: { color: COLORS.textDark, fontSize: "12.5px", fontWeight: "700" },
    roleTag: { fontSize: "9px", color: COLORS.brandGreen, fontWeight: "700" },
    avatar: { width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" },
    btnLogout: { padding: "0.45rem 0.85rem", backgroundColor: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
    btnLogin: { padding: "0.5rem 1.1rem", backgroundColor: COLORS.textDark, color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12.5px" },
    mainContent: { flex: 1, display: "flex" },
    footer: { backgroundColor: COLORS.footerBg, borderTop: "1px solid #1e293b", padding: "2.5rem 3rem 1.5rem 3rem" },
    footerContainer: { maxWidth: "1300px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1.1fr", gap: "2.5rem" },
    footerCol: { display: "flex", flexDirection: "column", gap: "0.7rem" },
    footerHeadingMain: { fontSize: "13px", fontWeight: "700", color: COLORS.textLight, margin: 0 },
    footerHeading: { fontSize: "11px", fontWeight: "700", color: "#94a3b8" },
    footerText: { color: "#94a3b8", fontSize: "12px", lineHeight: "1.6", margin: 0 },
    footerLink: { color: "#64748b", fontSize: "12px" },
    institutionName: { color: "#38bdf8", fontSize: "12.5px", fontWeight: "600", margin: 0 }
};