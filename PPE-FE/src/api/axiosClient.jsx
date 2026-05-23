import axios from "axios";

// Lấy giá trị cookie theo tên
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

// Xóa cookie theo tên
const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Dọn dẹp các cookie xác thực ở client
const clearAuthCookies = () => {
    deleteCookie("accessToken");
    deleteCookie("userId");
    deleteCookie("userRole");
};

const axiosClient = axios.create({
    baseURL: "http://localhost:8080/api/v1",
    timeout: 150000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Bắt buộc gửi kèm cookie trong mọi request
});

// REQUEST INTERCEPTOR: Cấu hình Header Authorization từ Cookie
axiosClient.interceptors.request.use(
    (config) => {
        const token = getCookie("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Xử lý kết quả và tự động Refresh Token khi hết hạn (401)
axiosClient.interceptors.response.use(
    (response) => {
        if (response.data) {
            return response.data;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const data = error.response?.data;

        // Xử lý tự động Refresh Token khi lỗi 401 Unauthorized
        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Gọi endpoint refresh (HttpOnly cookie refreshToken tự động được đính kèm)
                await axios.post("http://localhost:8080/api/v1/auth/refresh", {}, {
                    withCredentials: true
                });

                // Thực hiện lại request gốc sau khi có cookie mới
                return axiosClient(originalRequest);
            } catch (refreshError) {
                clearAuthCookies();
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            }
        }

        // Xử lý đăng xuất nếu lỗi 401 không thể refresh
        if (status === 401) {
            clearAuthCookies();
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        // Chuẩn hóa cấu trúc lỗi trả về cho Frontend
        const normalizedError = {
            status,
            data,
            message: data?.message || error.message || "Unknown error from server",
        };

        return Promise.reject(normalizedError);
    }
);

export default axiosClient;