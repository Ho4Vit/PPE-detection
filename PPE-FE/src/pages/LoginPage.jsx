import React from "react";
import "./LoginPage.css";

const LoginPage = () => {
    // Redirect handling via secure corporate identity management proxy
    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/api/oauth2/authorization/google";
    };

    return (
        <div className="intense-login-wrapper">
            {/* Background Core Matrix */}
            <div className="cyber-grid"></div>
            <div className="ambient-glow cyan"></div>
            <div className="ambient-glow orange"></div>

            <div className="login-container">
                {/* Left Panel - Cyber Brand Shield */}
                <div className="brand-panel">
                    <div className="brand-content">
                        <div className="logo">
                            <div className="logo-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                            </div>
                            <span className="logo-text">WORKPLACE SAFETY AI</span>
                        </div>

                        <h1 className="brand-title">
                            Next-Gen <br />
                            <span className="text-gradient">Cognitive Video Matrix</span> <br />
                            for Enterprise Protection
                        </h1>
                        <p className="brand-subtitle">
                            Empower your existing operations with computerized vision intelligence.
                            Track asset behaviors, ensure full occupational health compliance, and instantly identify workplace vulnerabilities.
                        </p>

                        <div className="features">
                            <div className="feature">
                                <div className="feature-icon helmet-dot">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M2 11a10 10 0 0 1 20 0v2H2z" />
                                        <path d="M6 13v4a6 6 0 0 0 12 0v-4" />
                                    </svg>
                                </div>
                                <span className="feature-text">Hard Hat Detection Engine</span>
                            </div>

                            <div className="feature">
                                <div className="feature-icon vest-dot">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 3 L10 3 L12 8 L14 3 L19 3 L21 10 L18 21 L6 21 L3 10 Z" />
                                    </svg>
                                </div>
                                <span className="feature-text">High-Visibility Vest Scanning</span>
                            </div>

                            <div className="feature">
                                <div className="feature-icon mask-dot">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 10c0 7-9 11-9 11s-9-4-9-11V5l9-3 9 3z" />
                                    </svg>
                                </div>
                                <span className="feature-text">Respiratory Protection Audit</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Secured Portal Form */}
                <div className="login-panel">
                    <div className="login-card">

                        {/* Mobile Responsive Header Identity */}
                        <div className="mobile-logo">
                            <div className="logo-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                </svg>
                            </div>
                            <span className="logo-text">SAFETY AI</span>
                        </div>

                        <div className="login-header">
                            <h2 className="login-title">Secure Portal Access</h2>
                            <p className="login-subtitle">Connect node stream control centers</p>
                        </div>

                        {/* Google Auth Action Trigger */}
                        <button className="google-btn" onClick={handleGoogleLogin}>
                            <svg className="google-svg" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Authenticate via Google</span>
                            <span className="auth-arrow">→</span>
                        </button>

                        <div className="divider">
                            <div className="divider-line"></div>
                            <span className="divider-text">ENCRYPTED DISPATCH</span>
                            <div className="divider-line"></div>
                        </div>

                        {/* Enterprise Informational Banner */}
                        <div className="info-box">
                            <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                            </svg>
                            <p>Identity mapping is sandboxed. Real-time stream telemetry contains anonymized logs to maintain regional privacy regulations.</p>
                        </div>

                        <div className="login-footer">
                            <p className="footer-text">
                                Protected by centralized credential protocols. <br />
                                <a href="#terms">Compliance Terms</a> // <a href="#privacy">Privacy Topology</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;