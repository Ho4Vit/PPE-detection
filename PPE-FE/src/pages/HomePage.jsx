import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate("/login");
    };

    return (
        <div className="intense-landing">
            {/* Background Architecture */}
            <div className="cyber-grid"></div>
            <div className="ambient-glow cyan"></div>
            <div className="ambient-glow orange"></div>

            {/* Hero Section */}
            <header className="intense-hero">
                <div className="hero-left">
                    <div className="status-badge">
                        <span className="badge-dot"></span>
                        <span className="badge-text">AI Workplace Safety Platform Active</span>
                    </div>
                    <h1 className="hero-main-title">
                        Transform Existing Cameras <br />
                        into <span className="text-gradient">AI-Powered Ecosystems</span> <br />
                        for Labor Protection
                    </h1>
                    <p className="hero-sub-desc">
                        An advanced computer vision platform analyzing video streams in real-time.
                        Automate your PPE checklists at facility scale to mitigate operational risks,
                        protect workforce health, and secure seamless data compliance.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn-primary-intense" onClick={handleGetStarted}>
                            Explore Dashboard
                            <span className="action-arrow">→</span>
                        </button>
                    </div>
                </div>

                {/* Right Area: Intenseeye Real-time Camera HUD Simulation */}
                <div className="hero-right">
                    <div className="video-mockup-wrapper">
                        <div className="scanner-line"></div>
                        <div className="camera-overlay-ui">
                            <span className="cam-label">CAM_02 // WAREHOUSE_ZONE_B</span>
                            <span className="cam-fps">FPS: 30.0</span>
                            <div className="rec-indicator">
                                <span className="rec-dot"></span>LIVE
                            </div>
                        </div>

                        {/* Simulated CCTV Stream Viewport */}
                        <div className="simulated-stream">
                            <div className="matrix-bg"></div>

                            {/* Forklift Zone Restriction Overlay (From Reference Image) */}
                            <div className="forklift-danger-zone"></div>

                            {/* Worker Bounding box & Skeleton simulation */}
                            <div className="simulated-worker-box">
                                <span className="box-label danger">Worker ID: 2</span>

                                {/* Inner PPE Checklist Overlay Panel */}
                                <div className="ppe-checklist-overlay">
                                    <div className="checklist-header">Confidence: 93%</div>
                                    <div className="checklist-sub">Equipped PPEs:</div>
                                    <div className="check-item fail">✗ Hard Hat</div>
                                    <div className="check-item ok">✓ Reflective Vest</div>
                                    <div className="check-item fail">✗ Mask</div>
                                </div>

                                {/* 3D Polygon Solid Body Mesh Mapping */}
                                <svg className="simulated-3d-body" viewBox="0 0 120 220">
                                    {/* 3D Poly Head mesh */}
                                    <polygon points="60,26 48,36 48,50 60,58 72,50 72,36" fill="#f43f5e" opacity="0.3" stroke="#f43f5e" strokeWidth="1" />
                                    {/* Neck */}
                                    <polygon points="56,58 64,58 64,66 56,66" fill="#f43f5e" opacity="0.4" />
                                    {/* Bulky Upper Torso (Wearing Reflective Vest) */}
                                    <polygon points="32,66 88,66 94,130 26,130" fill="#f97316" opacity="0.45" stroke="#f97316" strokeWidth="1.5" />
                                    {/* Reflective Stripes */}
                                    <polygon points="44,66 48,130 54,130 48,66" fill="#ffffff" opacity="0.6" />
                                    <polygon points="76,66 72,130 66,130 72,66" fill="#ffffff" opacity="0.6" />
                                    {/* Bulky Arms */}
                                    <polygon points="26,68 14,95 20,125 30,105 32,66" fill="#f43f5e" opacity="0.2" stroke="#f43f5e" strokeWidth="0.5" />
                                    <polygon points="88,66 90,105 100,125 106,95 94,68" fill="#f43f5e" opacity="0.2" stroke="#f43f5e" strokeWidth="0.5" />
                                    {/* Thicker Lower Body / Hips */}
                                    <polygon points="26,130 94,130 84,170 36,170" fill="#f43f5e" opacity="0.25" stroke="#f43f5e" strokeWidth="1" />
                                    {/* Left & Right Muscular Legs */}
                                    <polygon points="36,170 56,170 54,215 32,215" fill="#f43f5e" opacity="0.3" stroke="#f43f5e" strokeWidth="1" />
                                    <polygon points="64,170 84,170 88,215 66,215" fill="#f43f5e" opacity="0.3" stroke="#f43f5e" strokeWidth="1" />
                                </svg>
                            </div>

                            {/* HUD Bottom Notification Banner */}
                            <div className="hud-alert-banner">
                                <div className="alert-title">Alert! Dynamic delimitation areas</div>
                                <div className="alert-sub">Unsafe state verified &gt; 5.0s // Data logged</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Core Capabilities Section (No tech leaks, focus on business value) */}
            <section className="intense-features">
                <div className="features-head">
                    <div className="tech-tag">PRODUCT CAPABILITIES</div>
                    <h2>Comprehensive PPE Detection Matrix</h2>
                </div>

                <div className="intense-grid">
                    {/* Hard Hat Module */}
                    <div className="matrix-card">
                        <div className="matrix-glow"></div>
                        <div className="matrix-icon helmet-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 11a10 10 0 0 1 20 0v2H2z" />
                                <path d="M12 2v3" />
                                <path d="M6 13v4a6 6 0 0 0 12 0v-4" />
                            </svg>
                        </div>
                        <h3>Hard Hat</h3>
                        <p>Prevent traumatic injuries caused by falling tools, parts, or crane-mounted hardware in overhead or multi-level workspaces.</p>
                        <div className="card-redirect" onClick={handleGetStarted}>
                            <span>Learn more</span> <span className="arrow-svg">→</span>
                        </div>
                    </div>

                    {/* Reflective Vest Module */}
                    <div className="matrix-card">
                        <div className="matrix-glow"></div>
                        <div className="matrix-icon vest-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 3 L10 3 L12 8 L14 3 L19 3 L21 10 L18 21 L6 21 L3 10 Z" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                                <line x1="6" y1="15" x2="18" y2="15" />
                            </svg>
                        </div>
                        <h3>Reflective Vest</h3>
                        <p>Reduce struck-by risk by ensuring reflective vests are worn near forklifts, AGVs, and heavy mobile equipment inside complex industrial facilities.</p>
                        <div className="card-redirect" onClick={handleGetStarted}>
                            <span>Learn more</span> <span className="arrow-svg">→</span>
                        </div>
                    </div>

                    {/* Mask / RPE Module */}
                    <div className="matrix-card">
                        <div className="matrix-glow"></div>
                        <div className="matrix-icon mask-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 11-9 11s-9-4-9-11V5l9-3 9 3z" />
                                <path d="M8 10h8" />
                                <path d="M8 14h8" />
                            </svg>
                        </div>
                        <h3>Respiratory Protection (Mask)</h3>
                        <p>Ensure respiratory protective equipment is consistently worn to protect against inhalation of harmful industrial dust, vapors, or toxic fumes.</p>
                        <div className="card-redirect" onClick={handleGetStarted}>
                            <span>Learn more</span> <span className="arrow-svg">→</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;