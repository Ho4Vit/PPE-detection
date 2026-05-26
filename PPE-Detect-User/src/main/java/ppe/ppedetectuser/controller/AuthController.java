package ppe.ppedetectuser.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ppe.ppedetectuser.entities.DTO.UsersDTO;
import ppe.ppedetectuser.entities.response.ResponseData;
import ppe.ppedetectuser.services.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "0. Xác thực (Auth)", description = "Các API đăng nhập, đăng xuất hệ thống")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất hệ thống", description = "Vô hiệu hóa Access Token vào Redis Blacklist, xóa Refresh Token và làm sạch toàn bộ Cookie ở trình duyệt.")
    public ResponseEntity<ResponseData<String>> logout(HttpServletRequest request, HttpServletResponse response) {
        return authService.logout(request, response);
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin người dùng hiện tại", description = "Đọc session/cookie hoặc JWT từ request để trả về thông tin chi tiết của tài khoản đang đăng nhập.")
    public ResponseEntity<ResponseData<UsersDTO>> getCurrentUser(HttpServletRequest request) {
        return authService.getCurrentUser(request);
    }
}