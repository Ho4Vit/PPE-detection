import React from "react";
import { Routes, Route, Link } from "react-router-dom";

// IMPORT LAYOUTS (Điều chỉnh lại đường dẫn khít với dự án của bạn nếu cần)
import DashboardLayout from "@/components/layouts/DashboardLayout.jsx";
import AdminLayout from "@/components/layouts/AdminLayout.jsx";

// PAGES PUBLIC
import Login from "@/pages/Login.jsx";

// PAGES USER / OPERATOR (Giám sát an toàn)
import Home from "@/pages/Home.jsx";
import DashboardTest from "@/pages/DashboardTest.jsx"; // File màn hình camera HD chúng ta vừa tối ưu
import ViolationHistory from "@/pages/ViolationHistory.jsx"; // Trang xem log và xuất thống kê Excel

// PAGES ADMIN (Quản trị hệ thống PPE)
import CameraManagement from "@/pages/admin/CameraManagement.jsx";
import SystemSettings from "@/pages/admin/SystemSettings.jsx";

export default function AppRoutes() {
    return (
        <Routes>
            {/* ================= 1. CÁC TRANG PUBLIC ĐỘC LẬP ================= */}
            <Route path="/login" element={<Login />} />

            {/* ================= 2. PHÂN VÙNG GIÁM SÁT (OPERATOR AREA) ================= */}
            {/* Nhóm này dùng chung DashboardLayout (Có Sidebar điều hướng, Header hiển thị trạng thái) */}
            <Route element={<DashboardLayout />}>
                {/* Trang tổng quan hệ thống */}
                <Route path="/" element={<Home />} />

                {/* Màn hình giám sát Real-time Camera (File code DashboardTest) */}
                <Route path="/live-monitor" element={<DashboardTest />} />

                {/* Trang tra cứu lịch sử vi phạm & Xuất báo cáo Excel */}
                <Route path="/history" element={<ViolationHistory />} />
            </Route>

            {/* ================= 3. PHÂN VÙNG QUẢN TRỊ (ADMIN AREA) ================= */}
            {/* Nhóm này dùng chung AdminLayout riêng để cấu hình phần cứng/hệ thống */}
            <Route element={<AdminLayout />}>
                {/* Quản lý danh sách, cấu hình IP/Luồng RTSP của các Camera */}
                <Route path="/admin/cameras" element={<CameraManagement />} />

                {/* Cấu hình hệ thống (Ví dụ: Chỉnh sửa thời gian vi phạm 5s, cấu hình gửi mail) */}
                <Route path="/admin/settings" element={<SystemSettings />} />
            </Route>

            {/* ================= 4. TRANG BÁO LỖI 404 (SECTOR NOT FOUND) ================= */}
            <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 px-6 text-center text-white">
                    <h1 className="text-9xl font-black text-slate-800 italic tracking-tighter leading-none mb-4 animate-pulse">404</h1>
                    <h2 className="text-2xl font-black text-red-500 uppercase tracking-tighter mb-2 italic">
                        SYSTEM ERROR: SECTOR NOT FOUND
                    </h2>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8 max-w-sm">
                        Đường dẫn yêu cầu không tồn tại hoặc bạn không có quyền truy cập vùng an toàn này.
                    </p>
                    <Link
                        to="/"
                        className="px-8 py-3 bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-900/50 transition-all hover:-translate-y-1"
                    >
                        Quay lại Trang Chủ
                    </Link>
                </div>
            } />
        </Routes>
    );
}