package com.example.authservice.config;

import com.example.authservice.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter =
                jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(csrf ->
                        csrf.disable()
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth ->
                        auth

                                /*
                                 * Public endpoints.
                                 */
                                .requestMatchers(
                                        "/api/auth/register/customer",
                                        "/api/auth/register/provider",
                                        "/api/auth/provider-license/upload",
                                        "/api/auth/provider-licenses/**",
                                        "/api/auth/login",
                                        "/api/auth/refresh"
                                )
                                .permitAll()

                                /*
                                 * Internal endpoint.
                                 *
                                 * Spring Security cho request đi vào
                                 * controller, sau đó AuthService kiểm tra
                                 * X-Internal-Token.
                                 */
                                .requestMatchers(
                                        "/api/auth/users/*/exists",
                                        "/api/auth/users/*/contact"
                                )
                                .permitAll()

                                /*
                                 * Admin.
                                 */
                                .requestMatchers(
                                        "/api/auth/admin/**",
                                        "/api/auth/providers/**"
                                )
                                .hasRole("ADMIN")

                                /*
                                 * Các endpoint còn lại cần JWT.
                                 */
                                .anyRequest()
                                .authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}