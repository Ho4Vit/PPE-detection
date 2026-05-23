import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// PAGES HIỆN CÓ (Dùng đường dẫn tương đối nhảy trực tiếp)
import Login from "../pages/LoginPage.jsx";
import LoginSuccessPage from "../pages/LoginSuccessPage.jsx";

// Component bảo vệ Route (Ngăn truy cập lậu vào dashboard nếu chưa có Cookie định danh)
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
                <p className="text-sm font-bold uppercase tracking-widest animate-pulse">
                    Đang xác thực phiên làm việc...
                </p>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function AppRoutes() {
    return (
        <Routes>
            {/* ================= 1. CÁC TUYẾN ĐƯỜNG PUBLIC ================= */}
            {/* Trang chứa nút bấm gọi luồng Đăng nhập Google */}
            <Route path="/login" element={<Login />} />

            {/* Cổng đón đầu redirect từ Spring Boot OAuth2 (?status=success) */}
            <Route path="/login-success" element={<LoginSuccessPage />} />


            {/* ================= 2. PHÂN VÙNG BẢO MẬT (DÀNH CHO CÁC TRANG SAU NÀY) ================= */}
            {/* Khi cookie hợp lệ, LoginSuccessPage sẽ đá người dùng vào đây */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
                            <h2 className="text-2xl font-black text-green-400 uppercase tracking-wider mb-2">
                                ĐĂNG NHẬP THÀNH CÔNG!
                            </h2>
                            <p className="text-slate-400 text-sm font-medium">
                                Hệ thống bảo mật đã xác thực Cookie thành công. (Giao diện Dashboard camera đang phát triển).
                            </p>
                        </div>
                    </ProtectedRoute>
                }
            />


            {/* ================= 3. TRANG BÁO LỖI 404 ================= */}
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
                        to="/login"
                        className="px-8 py-3 bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-900/50 transition-all hover:-translate-y-1"
                    >
                        Quay lại Đăng Nhập
                    </Link>
                </div>
            } />
        </Routes>
    );
}