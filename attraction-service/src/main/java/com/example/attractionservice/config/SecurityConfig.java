package com.example.attractionservice.config;

import com.example.attractionservice.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/api/attractions/internal/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/attractions/catalog"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/attractions/search",
                                "/api/attractions/tickets/*",
                                "/api/attractions/images/**",
                                "/api/attractions/*"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/attractions/images/upload"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_ATTRACTION"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/attractions/tickets/*/hold"
                        ).authenticated()

                        .requestMatchers(
                                "/api/attractions/holds/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/attractions"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_ATTRACTION"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/attractions"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_ATTRACTION"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/attractions/*"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_ATTRACTION"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/attractions/*"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_ATTRACTION"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/attractions/*/tickets"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_ATTRACTION"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/attractions/*/tickets/*"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_ATTRACTION"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/attractions/*/tickets/*"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_ATTRACTION"
                        )

                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
