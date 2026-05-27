package ppe.ppedetectuser.config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import ppe.ppedetectuser.config.authentication.JwtFilter;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .cors(withDefaults())
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 🌟 BỔ SUNG: Chặn đứng hành vi tự động Redirect 302 của OAuth2 khi chưa đăng nhập
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            // Trả về mã lỗi 401 JSON rõ ràng cho ReactJS thay vì chuyển hướng sang Google
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\": \"Phiên xác thực đã hết hạn hoặc không hợp lệ.\"}");
                        })
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(
                                "/api/oauth2/**",
                                "/api/login/oauth2/**",
                                "/oauth2/**",
                                "/login/oauth2/**"
                        ).permitAll()
                        .requestMatchers("/api/auth/google/login").permitAll()
                        .requestMatchers("/api/v1/violations/report").permitAll()
                        .requestMatchers("/api/v1/auth/logout").authenticated()

                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(authorization ->
                                authorization.baseUri("/api/oauth2/authorization")
                        )
                        .redirectionEndpoint(redirection ->
                                redirection.baseUri("/api/login/oauth2/code/*")
                        )
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}