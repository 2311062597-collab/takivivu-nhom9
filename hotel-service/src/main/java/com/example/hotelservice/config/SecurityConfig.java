package com.example.hotelservice.config;

import com.example.hotelservice.security.JwtAuthenticationFilter;
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
                                "/api/hotels/internal/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/hotels/catalog",
                                "/api/hotels/*/physical-inventory",
                                "/api/hotels/physical-inventory/max-price"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/hotels/images/**",
                                "/api/hotels/search",
                                "/api/hotels/rooms/*",
                                "/api/hotels/*"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/hotels/rooms/*/hold"
                        ).authenticated()

                        .requestMatchers(
                                "/api/hotels/holds/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/hotels"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_HOTEL"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/hotels",
                                "/api/hotels/images/upload"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_HOTEL"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/hotels/*"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_HOTEL"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/hotels/*"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_HOTEL"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/hotels/*/rooms"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_HOTEL"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/hotels/*/rooms/*"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_HOTEL"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/hotels/*/rooms/*"
                        ).hasAnyAuthority(
                                "ROLE_ADMIN",
                                "PROVIDER_TYPE_HOTEL"
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
