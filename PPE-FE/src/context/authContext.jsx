import React, { createContext, useState, useEffect, useContext, useCallback } from "react";

export const AuthContext = createContext();

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const rawValue = parts.pop().split(';').shift();
        try {
            return decodeURIComponent(rawValue);
        } catch (e) {
            return rawValue;
        }
    }
    return null;
};

const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const AuthProvider = ({ children }) => {
    // Khởi tạo state từ localStorage nếu có sẵn để tránh giật màn hình khi F5
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("ppe_user");
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [loading, setLoading] = useState(true);

    // Đồng bộ dữ liệu từ Cookie vào cả State và LocalStorage
    const syncAuthWithCookies = useCallback(() => {
        const userId = getCookie("userId");
        const token = getCookie("accessToken");
        const fullName = getCookie("userFullName");
        const avatarUrl = getCookie("userAvatarUrl");
        const role = getCookie("userRole");

        if (userId && token) {
            const userData = {
                id: userId,
                role: role,
                fullName: fullName,
                avatarUrl: avatarUrl,
                token: token // 🌟 Đã lưu token vào đây để các component khác lấy ra dùng
            };

            // Chỉ cập nhật state nếu dữ liệu thực sự có sự thay đổi để CHẶN VÒNG LẶP RE-RENDER
            const currentUserStr = localStorage.getItem("ppe_user");
            const nextUserStr = JSON.stringify(userData);

            if (currentUserStr !== nextUserStr) {
                setUser(userData);
                localStorage.setItem("ppe_user", nextUserStr);
            }
            return true;
        } else {
            // Nếu Cookie trống rỗng (User đã logout hoặc hết hạn ở Backend) thì dọn sạch storage
            if (localStorage.getItem("ppe_user")) {
                setUser(null);
                localStorage.removeItem("ppe_user");
            }
            return false;
        }
    }, []);

    const loginWithCookie = useCallback(() => {
        setLoading(true);
        const isSuccess = syncAuthWithCookies();
        setLoading(false);

        if (isSuccess) {
            return Promise.resolve(true);
        } else {
            return Promise.reject("Không tìm thấy thông tin xác thực từ hệ thống");
        }
    }, [syncAuthWithCookies]);

    const logout = () => {
        setUser(null);
        localStorage.removeItem("ppe_user"); // Xóa sạch storage khi thoát
        deleteCookie("accessToken");
        deleteCookie("userId");
        deleteCookie("userRole");
        deleteCookie("userFullName");
        deleteCookie("userAvatarUrl");
        // Điều hướng thẳng về trang đăng nhập bằng href để reset sạch bộ nhớ ram của React
        window.location.href = "/login";
    };

    // Chạy duy nhất 1 lần khi ứng dụng React khởi tạo (Mounting) để kiểm tra phiên làm việc
    useEffect(() => {
        syncAuthWithCookies();
        setLoading(false);
    }, []); // Chặn đứng tình trạng gọi lặp lại vô hạn bằng mảng dependency trống

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, loginWithCookie, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);