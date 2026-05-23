import React from "react";
import "./LoginPage.css"; // 🌟 Import trực tiếp file CSS thuần vừa tạo ở trên

const LoginPage = () => {
    // Cấu hình URL chuyển hướng đăng nhập qua Spring Cloud Gateway của hệ thống
    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/api/oauth2/authorization/google";
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-container">

                {/* Left Panel - Giao diện thương hiệu bên trái (Chỉ hiện trên PC/Tablet) */}
                <div className="brand-panel">
                    <div className="brand-content">
                        <div className="logo">
                            <div className="logo-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                            </div>
                            <span className="logo-text">PPE Detector</span>
                        </div>

                        <h1 className="brand-title">AI-Powered Safety Equipment Detection</h1>
                        <p className="brand-subtitle">
                            Ensure workplace safety with our advanced AI system that detects and monitors personal protective equipment in real-time.
                        </p>

                        <div className="features">
                            <div className="feature">
                                <div className="feature-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </div>
                                <span className="feature-text">Real-time Equipment Detection</span>
                            </div>

                            <div className="feature">
                                <div className="feature-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 3v18h18" />
                                        <path d="m19 9-5 5-4-4-3 3" />
                                    </svg>
                                </div>
                                <span className="feature-text">Analytics Dashboard</span>
                            </div>

                            <div className="feature">
                                <div className="feature-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                    </svg>
                                </div>
                                <span className="feature-text">Compliance Reports</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form xử lý đăng nhập bên phải */}
                <div className="login-panel">
                    <div className="login-card">

                        {/* Logo phụ xuất hiện khi co màn hình điện thoại nhỏ */}
                        <div className="mobile-logo">
                            <div className="logo-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                            </div>
                            <span className="logo-text">PPE Detector</span>
                        </div>

                        <div className="login-header">
                            <h2 className="login-title">Welcome Back</h2>
                            <p className="login-subtitle">Sign in to access your dashboard</p>
                        </div>

                        {/* Nút đăng nhập Google đồng bộ hành động click */}
                        <button className="google-btn" onClick={handleGoogleLogin}>
                            <svg viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="divider">
                            <div className="divider-line"></div>
                            <span className="divider-text">Secure Login</span>
                            <div className="divider-line"></div>
                        </div>

                        <div className="info-box">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                            </svg>
                            <p>Your data is protected with enterprise-grade security. We only use Google for authentication.</p>
                        </div>

                        <div className="footer">
                            <p className="footer-text">
                                By signing in, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;