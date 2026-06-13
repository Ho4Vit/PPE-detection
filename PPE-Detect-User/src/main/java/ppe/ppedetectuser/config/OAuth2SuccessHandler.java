package ppe.ppedetectuser.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import ppe.ppedetectuser.config.authentication.JwtService;
import ppe.ppedetectuser.entities.Users;
import ppe.ppedetectuser.entities.enums.UserRole;
import ppe.ppedetectuser.repositories.UsersRepository;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UsersRepository usersRepository;
    private final JwtService jwtService;

    @Value("${app.frontend-redirect-url}")
    private String frontendRedirectUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String googleId = oauthUser.getAttribute("sub");
        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        String avatar = oauthUser.getAttribute("picture");

        Users user = usersRepository.findByGoogleId(googleId)
                .orElseGet(() -> usersRepository.save(
                        Users.builder()
                                .googleId(googleId)
                                .email(email)
                                .fullName(name)
                                .avatarUrl(avatar)
                                .role(UserRole.USER)
                                .active(true)
                                .build()
                ));

        if (!user.isActive()) {
            response.sendRedirect(frontendRedirectUrl + "?error=disabled");
            return;
        }

        user.setLastLogin(LocalDateTime.now());
        usersRepository.save(user);

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        int oneDayInSeconds = 24 * 60 * 60;
        int oneWeekInSeconds = 7 * 24 * 60 * 60;

        addCookieHeader(response, "accessToken", accessToken, oneDayInSeconds, false);
        addCookieHeader(response, "refreshToken", refreshToken, oneWeekInSeconds, true);
        addCookieHeader(response, "userRole", user.getRole().name(), oneDayInSeconds, false);
        addCookieHeader(response, "userId", user.getId().toString(), oneDayInSeconds, false);

        String encodedName = URLEncoder.encode(user.getFullName() != null ? user.getFullName() : "Người dùng", StandardCharsets.UTF_8);
        addCookieHeader(response, "userFullName", encodedName, oneDayInSeconds, false);

        String avatarUrl = user.getAvatarUrl() != null ? user.getAvatarUrl() : "";
        addCookieHeader(response, "userAvatarUrl", avatarUrl, oneDayInSeconds, false);

        response.sendRedirect(frontendRedirectUrl + "?status=success");
    }

    /**
     * Helper để tạo header Set-Cookie thủ công
     */
    private void addCookieHeader(HttpServletResponse response, String name, String value, int maxAge, boolean httpOnly) {
        StringBuilder cookie = new StringBuilder();
        cookie.append(name).append("=").append(value).append("; ");
        cookie.append("Path=/; ");
        cookie.append("Max-Age=").append(maxAge).append("; ");
        if (httpOnly) cookie.append("HttpOnly; ");
        cookie.append("SameSite=Lax"); // Quan trọng: Lax cho phép gửi cookie khi redirect từ Google về

        response.addHeader("Set-Cookie", cookie.toString());
    }
}