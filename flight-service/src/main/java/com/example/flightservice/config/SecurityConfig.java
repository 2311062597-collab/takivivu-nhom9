package com.example.flightservice.config;

import com.example.flightservice.security.JwtAuthenticationFilter;
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
                                "/api/flights/internal/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/flights/catalog"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/flights/search"
                        ).permitAll()

                        // Public customer flight detail page. The list/search endpoints are
                        // already public, so a customer must also be able to open /flights/{id}.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/flights/*/inventory"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/flights/*"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/flights/*/hold"
                        ).authenticated()

                        .requestMatchers(
                                "/api/flights/holds/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/flights"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_FLIGHT"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/flights"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_FLIGHT"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/flights/*"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_FLIGHT"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/flights/*"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_FLIGHT"
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
