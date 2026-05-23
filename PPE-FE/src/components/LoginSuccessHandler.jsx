import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const LoginSuccessHandler = () => {
    const { loginWithCookie } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const status = searchParams.get("status");

        if (status === "success") {
            loginWithCookie()
                .then(() => {
                    window.history.replaceState({}, document.title, window.location.pathname);

                    navigate("/dashboard");
                })
                .catch((err) => {
                    console.error("Xử lý nạp cookie thất bại:", err);
                    navigate("/login");
                });
        }
    }, [searchParams, loginWithCookie, navigate]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
            <h2 style={{ color: "#2b6cb0" }}>Đang đồng bộ quyền truy cập hệ thống PPE...</h2>
            <p style={{ color: "#718096" }}>Vui lòng đợi trong giây lát.</p>
        </div>
    );
};

export default LoginSuccessHandler;