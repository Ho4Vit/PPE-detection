package ppe.ppedetectuser.services;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import ppe.ppedetectuser.config.authentication.JwtService;
import ppe.ppedetectuser.config.authentication.TokenBlacklistService;
import ppe.ppedetectuser.entities.DTO.UsersDTO;
import ppe.ppedetectuser.entities.response.ResponseData;
import ppe.ppedetectuser.exception.AppErrorCode;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;
    private final TokenBlacklistService blacklistService;
    private final UsersCRUDService usersCRUDService;

    /**
     * API: Lấy thông tin người dùng hiện tại phục vụ chạy Web Frontend
     */
    public ResponseEntity<ResponseData<UsersDTO>> getCurrentUser(HttpServletRequest request) {
        // 1. Lấy Access Token từ Cookie giống hệt logic hàm logout
        String accessToken = jwtService.extractTokenFromCookie(request, "accessToken");

        if (accessToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponseData.<UsersDTO>builder()
                    .statusCode(String.valueOf(HttpStatus.UNAUTHORIZED.value()))
                    .message("Không tìm thấy phiên đăng nhập trong Cookie")
                    .build());
        }
        try {
            if (blacklistService.isBlacklisted(accessToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponseData.<UsersDTO>builder()
                        .statusCode(String.valueOf(HttpStatus.UNAUTHORIZED.value()))
                        .message("Phiên làm việc đã hết hạn hoặc đã đăng xuất")
                        .build());
            }
        } catch (Exception e) {

        }

        try {
            String userIdStr = jwtService.extractClaims(accessToken).getSubject();
            Long userId = Long.parseLong(userIdStr);

            ResponseEntity<ResponseData<UsersDTO>> userResponse = usersCRUDService.getById(userId);

            return ResponseEntity.ok(ResponseData.<UsersDTO>builder()
                    .statusCode(AppErrorCode.SUCCESS.getCode()) // Giữ nguyên kiểu String mặc định của hệ thống bạn
                    .message("Get current user successfully")
                    .data(userResponse.getBody().getData())
                    .build());

        } catch (Exception e) {
            // Đề phòng trường hợp Token lỗi, sai định dạng hoặc hết hạn sử dụng
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponseData.<UsersDTO>builder()
                    .statusCode(String.valueOf(HttpStatus.UNAUTHORIZED.value())) // 🌟 Sửa lỗi int -> String
                    .message("Xác thực Token không hợp lệ: " + e.getMessage())
                    .build());
        }
    }

    /**
     * API Đăng xuất hệ thống
     */
    public ResponseEntity<ResponseData<String>> logout(HttpServletRequest request, HttpServletResponse response) {
        // 1. Lấy Access Token từ Cookie để cho vào Blacklist Redis
        String accessToken = jwtService.extractTokenFromCookie(request, "accessToken");
        if (accessToken != null) {
            long remainingTime = jwtService.getRemainingTime(accessToken);
            if (remainingTime > 0) {
                // Đẩy vào Blacklist chặn không cho dùng lại nữa
                blacklistService.blacklist(accessToken, remainingTime);
            }

            try {
                String userId = jwtService.extractClaims(accessToken).getSubject();
                blacklistService.deleteRefreshToken(userId);
            } catch (Exception e) {
                // Ignore exception
            }
        }

        clearCookie(response, "accessToken");
        clearCookie(response, "refreshToken");
        clearCookie(response, "userRole");
        clearCookie(response, "userId");

        return ResponseEntity.ok(ResponseData.<String>builder()
                .statusCode(AppErrorCode.SUCCESS.getCode())
                .message("Logout successfully")
                .data("Goodbye!")
                .build());
    }

    private void clearCookie(HttpServletResponse response, String cookieName) {
        Cookie cookie = new Cookie(cookieName, null);
        cookie.setPath("/");
        cookie.setHttpOnly(cookieName.equals("refreshToken"));
        cookie.setMaxAge(0);
        cookie.setSecure(false);
        response.addCookie(cookie);
    }
}