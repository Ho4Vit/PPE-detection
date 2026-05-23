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
    // Khởi tạo state từ localStorage nếu có sẵn
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
                avatarUrl: avatarUrl
            };

            // 🌟 ĐỒNG BỘ VÀO STORAGE Ở ĐÂY
            setUser(userData);
            localStorage.setItem("ppe_user", JSON.stringify(userData));
            return true;
        }
        return false;
    }, []);

    const loginWithCookie = useCallback(() => {
        setLoading(true);
        const isSuccess = syncAuthWithCookies();
        setLoading(false);

        if (isSuccess) {
            return Promise.resolve(true);
        } else {
            return Promise.reject("Không tìm thấy thông tin xác thực");
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
        window.location.href = "/login";
    };

    useEffect(() => {
        syncAuthWithCookies();
        setLoading(false);
    }, [syncAuthWithCookies]);

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, loginWithCookie, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);