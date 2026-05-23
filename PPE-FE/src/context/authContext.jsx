import React, { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext();

// Hàm bổ trợ đọc Cookie bằng JS thuần
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

// Hàm bổ trợ xóa Cookie khi Logout
const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Đồng bộ trạng thái đăng nhập từ Cookie vào Context State
    const loginWithCookie = () => {
        setLoading(true);
        const userId = getCookie("userId");
        const userRole = getCookie("userRole");
        const token = getCookie("accessToken");

        if (userId && token) {
            // Lưu trữ thông tin cơ bản lấy từ Cookie của Backend vào State
            setUser({
                id: userId,
                role: userRole,
                token: token
            });
            setLoading(false);
            return Promise.resolve(true);
        } else {
            setLoading(false);
            return Promise.reject("Không tìm thấy thông tin xác thực trong Cookie");
        }
    };

    // Hàm Đăng xuất dọn dẹp sạch Cookie client
    const logout = () => {
        setUser(null);
        deleteCookie("accessToken");
        deleteCookie("userId");
        deleteCookie("userRole");
        // Lưu ý: Cookie 'refreshToken' có HttpOnly=true nên Backend sẽ tự xóa khi gọi API logout,
        // hoặc hết hạn tự hủy, client JS không can thiệp xóa cứng được.
        window.location.href = "/login";
    };

    // Tự động kiểm tra lại phiên làm việc khi người dùng F5 tải lại trang
    useEffect(() => {
        const userId = getCookie("userId");
        const token = getCookie("accessToken");

        if (userId && token) {
            setUser({
                id: userId,
                role: getCookie("userRole"),
                token: token
            });
        }
        setLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, loginWithCookie, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);