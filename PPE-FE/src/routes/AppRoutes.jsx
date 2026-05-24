import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// LAYOUT
import MainLayout from "../components/layouts/MainLayout.jsx";

// PAGES HIỆN CÓ
import HomePage from "../pages/HomePage.jsx";
import Login from "../pages/LoginPage.jsx";
import LoginSuccessPage from "../pages/LoginSuccessPage.jsx";

// IMPORT PAGE QUẢN LÝ CAMERA MỚI
import CameraManagement from "../pages/CameraManagement.jsx";

// Component bảo vệ Route
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-emerald-50 text-emerald-900">
                <p className="text-sm font-bold uppercase tracking-widest animate-pulse">
                    Đang xác thực phiên làm việc bảo hộ PPE...
                </p>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function AppRoutes() {
    return (
        <Routes>
            {/* ================= 1. CÁC TRANG CHẠY ĐỘC LẬP (Không chứa Header & Footer) ================= */}
            <Route path="/login" element={<Login />} />
            <Route path="/login-success" element={<LoginSuccessPage />} />

            {/* ================= 2. PHÂN VÙNG SỬ DỤNG LAYOUT CHUNG (Có Header & Footer) ================= */}
            <Route element={<MainLayout />}>
                {/* Trang chủ công khai */}
                <Route path="/" element={<HomePage />} />

                <Route path="/camera-management" element={<CameraManagement />}/>
            </Route>

            {/* ================= 3. TRANG BÁO LỖI 404 (Không chứa Header & Footer) ================= */}
            <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 px-6 text-center text-white">
                    <h1 className="text-9xl font-black text-slate-800 italic tracking-tighter leading-none mb-4 animate-pulse">404</h1>
                    <h2 className="text-2xl font-black text-red-500 uppercase tracking-tighter mb-2 italic">
                        SYSTEM ERROR: SECTOR NOT FOUND
                    </h2>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8 max-w-sm">
                        Đường dẫn yêu cầu không tồn tại hoặc phiên làm việc của bạn đã hết hạn.
                    </p>
                    <Link
                        to="/"
                        className="px-8 py-3 bg-green-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-green-700 shadow-xl shadow-green-900/50 transition-all hover:-translate-y-1"
                    >
                        Quay lại Trang Chủ
                    </Link>
                </div>
            } />
        </Routes>
    );
}