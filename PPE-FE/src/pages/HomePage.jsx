import React from "react";
import { useNavigate } from "react-router-dom"; // Dùng để chuyển trang nếu có React Router
import "./HomePage.css"; // Import file CSS thuần

const HomePage = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate("/login"); // Chuyển hướng sang trang đăng nhập của bạn
    };

    return (
        <div className="home-page-wrapper">

            {/* Navigation Bar */}
            <nav className="navbar">
                <div className="nav-logo">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>PPE Detector</span>
                </div>
                <button className="nav-btn" onClick={handleGetStarted}>Dashboard</button>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <span className="hero-tag">YOLOv8 & Computer Vision</span>
                    <h1 className="hero-title">
                        Giám Sát An Toàn <span>Lao Động</span> Thời Gian Thực
                    </h1>
                    <p className="hero-desc">
                        Giải pháp ứng dụng trí tuệ nhân tạo tự động phát hiện vi phạm trang bị bảo hộ (Mũ, Áo phản quang, Giày) thông qua hệ thống Camera giám sát thông minh.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-primary" onClick={handleGetStarted}>Bắt Đầu Ngay</button>
                    </div>
                </div>

                {/* Khung mô phỏng luồng AI Terminal */}
                <div className="hero-image-container">
                    <div className="mockup-window">
                        <div className="mockup-header">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                        <div className="mockup-body">
                            <p>{"[AI_SERVICE] Loading YOLOv8 weights..."}</p>
                            <p style={{ color: '#22c55e' }}>{"[CAMERA_01] Connected to Stream..."}</p>
                            <p style={{ color: '#eab308' }}>{"[DETECTED] Person - Missing Helmet"}</p>
                            <p style={{ color: '#ef4444' }}>{"[ALERT] Unsafe state active (> 5s)"}</p>
                            <p style={{ color: '#ffffff' }}>{"[LOG] Violation logged -> Saving statistic"}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section - Giới thiệu tính năng logic hệ thống */}
            <section className="features-section">
                <div className="section-header">
                    <h2 className="section-title">Tính Năng Cốt Lõi</h2>
                    <p className="section-subtitle">Hệ thống tối ưu hiệu năng tối đa cho doanh nghiệp</p>
                </div>

                <div className="features-grid">

                    {/* Tính năng 1: Quản lý đa Camera */}
                    <div className="feature-card">
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                <circle cx="12" cy="13" r="4"/>
                            </svg>
                        </div>
                        <h3 className="card-title">Quản Lý Đa Camera</h3>
                        <p className="card-desc">Một tài khoản (User) quản lý linh hoạt đồng thời nhiều luồng Camera ở các phân xưởng vị trí khác nhau.</p>
                    </div>

                    {/* Tính năng 2: Thuật toán nhận diện chuẩn xác */}
                    <div className="feature-card">
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                <path d="M9 17V7l7 5z"/>
                            </svg>
                        </div>
                        <h3 className="card-title">Phát Hiện Vi Phạm</h3>
                        <p className="card-desc">Nhận diện chính xác trang phục bảo hộ: Người, Mũ (Helmet), Áo phản quang (Vest), Giày (Shoes) [cite: Dự án là Hệ thống giám sát an toàn lao động (PPE Detection). Kiến trúc bao gồm Microservices với Frontend (ReactJS), API Gateway (Spring Cloud Gateway), Service Discovery (Eureka Server), Backend (Java Spring Boot), AI Service (Python, YOLOv8 nhận diện Người, Helmet, Vest, Shoes từ webcam). Kịch bản demo là đội mũ bảo hộ hiện khung xanh "Safe", bỏ mũ ra hiện khung đỏ "Danger". Quy tắc đặc biệt là chỉ kích hoạt cảnh báo Unsafe nếu vi phạm liên tục quá 5 giây và không lưu file ảnh cắt vi phạm, chỉ ghi log và xuất thống kê ra file Excel.].</p>
                    </div>

                    {/* Tính năng 3: Bộ lọc trễ thông minh */}
                    <div className="feature-card">
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                        </div>
                        <h3 className="card-title">Cảnh Báo Trễ 5 Giây</h3>
                        <p className="card-desc">Loại bỏ hoàn toàn các báo động giả. Chỉ kích hoạt trạng thái "Unsafe" khi phát hiện vi phạm liên tục quá 5 giây [cite: Dự án là Hệ thống giám sát an toàn lao động (PPE Detection). Kiến trúc bao gồm Microservices với Frontend (ReactJS), API Gateway (Spring Cloud Gateway), Service Discovery (Eureka Server), Backend (Java Spring Boot), AI Service (Python, YOLOv8 nhận diện Người, Helmet, Vest, Shoes từ webcam). Kịch bản demo là đội mũ bảo hộ hiện khung xanh "Safe", bỏ mũ ra hiện khung đỏ "Danger". Quy tắc đặc biệt là chỉ kích hoạt cảnh báo Unsafe nếu vi phạm liên tục quá 5 giây và không lưu file ảnh cắt vi phạm, chỉ ghi log và xuất thống kê ra file Excel.].</p>
                    </div>

                    {/* Tính năng 4: Bảo mật dữ liệu & Xuất thống kê */}
                    <div className="feature-card">
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                        </div>
                        <h3 className="card-title">Báo Cáo Thống Kê Excel</h3>
                        <p className="card-desc">Hệ thống tối ưu lưu trữ bảo mật (không lưu ảnh vi phạm) [cite: Dự án là Hệ thống giám sát an toàn lao động (PPE Detection). Kiến trúc bao gồm Microservices với Frontend (ReactJS), API Gateway (Spring Cloud Gateway), Service Discovery (Eureka Server), Backend (Java Spring Boot), AI Service (Python, YOLOv8 nhận diện Người, Helmet, Vest, Shoes từ webcam). Kịch bản demo là đội mũ bảo hộ hiện khung xanh "Safe", bỏ mũ ra hiện khung đỏ "Danger". Quy tắc đặc biệt là chỉ kích hoạt cảnh báo Unsafe nếu vi phạm liên tục quá 5 giây và không lưu file ảnh cắt vi phạm, chỉ ghi log và xuất thống kê ra file Excel.], ghi log trực tiếp phục vụ việc kết xuất báo cáo thống kê định kỳ sang file Excel.</p>
                    </div>

                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-logo">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>PPE Detector</span>
                </div>
                <p>&copy; 2026 Hệ thống Giám Sát An Toàn Lao Động. All rights reserved.</p>
            </footer>

        </div>
    );
};

export default HomePage;