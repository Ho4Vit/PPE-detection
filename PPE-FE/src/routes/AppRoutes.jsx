import React from "react";
import { Routes, Route, Link, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// LAYOUT
import MainLayout from "../components/layouts/MainLayout.jsx";

// PAGES
import HomePage from "../pages/HomePage.jsx";
import Login from "../pages/LoginPage.jsx";
import LoginSuccessPage from "../pages/LoginSuccessPage.jsx";

// IMPORT CÁC TRANG CHỨC NĂNG HỆ THỐNG
import CameraManagement from "../pages/CameraManagement.jsx";
import DetectPage from "../pages/DetectPage.jsx";
import CameraViolationPage from "../pages/CameraViolationPage.jsx";

import AdminDashboard from "../pages/AdminDashboard.jsx";
import BannedPage from "../pages/BannedPage.jsx";

// ================= COMPONENT BẢO VỆ ROUTE ĐĂNG NHẬP CƠ BẢN =================
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

// ================= 🟢 COMPONENT BẢO VỆ ROUTE DÀNH RIÊNG CHO ADMIN =================
const AdminRoute = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-cyan-400">
                <p className="text-sm font-bold uppercase tracking-widest animate-pulse">
                    ĐANG KHỞI CHẠY MA TRẬN QUẢN TRỊ (ADMIN MATRIX)...
                </p>
            </div>
        );
    }

    // Kiểm tra: Phải đăng nhập và chuỗi role từ cookie trả về phải khớp với ADMIN hoặc ROLE_ADMIN
    const isAdmin = isAuthenticated && user && (user.role?.toUpperCase() === "ADMIN" || user.role?.toUpperCase() === "ROLE_ADMIN");

    // Nếu đúng Admin thì mở khóa đi tiếp (Outlet), nếu không thì đá văng về trang chủ hệ thống
    return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default function AppRoutes() {
    return (
        <Routes>
            {/* ================= 1. CÁC TRANG CHẠY ĐỘC LẬP ================= */}
            <Route path="/login" element={<Login />} />
            <Route path="/login-success" element={<LoginSuccessPage />} />
            <Route path="/banned" element={<BannedPage />} />

            {/* ================= 2. PHÂN VÙNG SỬ DỤNG LAYOUT CHUNG ================= */}
            <Route element={<MainLayout />}>
                {/* Trang chủ công khai */}
                <Route path="/" element={<HomePage />} />

                {/* Các phân hệ nội bộ yêu cầu bảo mật nghiêm ngặt (Quyền Operator cơ bản) */}
                <Route
                    path="/camera-management"
                    element={
                        <ProtectedRoute>
                            <CameraManagement />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/detect"
                    element={
                        <ProtectedRoute>
                            <DetectPage />
                        </ProtectedRoute>
                    }
                />

                {/* Trang xem nhật ký vi phạm theo từng camera */}
                <Route
                    path="/violations"
                    element={
                        <ProtectedRoute>
                            <CameraViolationPage />
                        </ProtectedRoute>
                    }
                />

                {/* 🔒 🟢 ROUTE ADMIN: ĐƯỢC LỒNG TRỰC TIẾP TRONG MAINLAYOUT */}
                {/* Vừa giữ được Header/Footer, vừa được bảo vệ nghiêm ngặt bằng bộ lọc AdminRoute */}
                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    {/* Bạn có thể bổ sung các trang quản trị con khác dùng chung layout tại đây nếu có */}
                </Route>
            </Route>

            {/* ================= 3. TRANG BÁO LỖI 404 (Đã sửa lỗi cú pháp) ================= */}
            <Route
                path="*"
                element={
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
                }
            />
        </Routes>
    );
}