package ppe.ppedetectuser.config;

import jakarta.servlet.http.Cookie;
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

        Cookie accessCookie = new Cookie("accessToken", accessToken);
        accessCookie.setHttpOnly(false);
        accessCookie.setSecure(false);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(oneDayInSeconds);
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(7 * 24 * 60 * 60);
        response.addCookie(refreshCookie);

        Cookie roleCookie = new Cookie("userRole", user.getRole().name());
        roleCookie.setPath("/");
        roleCookie.setMaxAge(oneDayInSeconds);
        response.addCookie(roleCookie);

        Cookie idCookie = new Cookie("userId", user.getId().toString());
        idCookie.setPath("/");
        idCookie.setMaxAge(oneDayInSeconds);
        response.addCookie(idCookie);

        String encodedName = URLEncoder.encode(user.getFullName() != null ? user.getFullName() : "Người dùng", StandardCharsets.UTF_8.toString());
        Cookie nameCookie = new Cookie("userFullName", encodedName);
        nameCookie.setPath("/");
        nameCookie.setMaxAge(oneDayInSeconds);
        response.addCookie(nameCookie);

        Cookie avatarCookie = new Cookie("userAvatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");
        avatarCookie.setPath("/");
        avatarCookie.setMaxAge(oneDayInSeconds);
        response.addCookie(avatarCookie);

        response.sendRedirect(frontendRedirectUrl + "?status=success");
    }
}