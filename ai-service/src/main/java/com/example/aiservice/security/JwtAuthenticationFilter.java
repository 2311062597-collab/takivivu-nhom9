package com.example.aiservice.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(
            JwtUtil jwtUtil
    ) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header =
                request.getHeader("Authorization");

        if (header != null
                && header.startsWith("Bearer ")) {

            String token =
                    header.substring(7);

            if (jwtUtil.kiemTraToken(token)) {

                Claims claims =
                        jwtUtil.layClaims(token);

                String email =
                        claims.getSubject();

                String role =
                        claims.get(
                                "role",
                                String.class
                        );

                Number userIdNumber =
                        claims.get(
                                "userId",
                                Number.class
                        );

                if (email != null
                        && role != null
                        && userIdNumber != null) {

                    Long userId =
                            userIdNumber.longValue();

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    null,
                                    List.of(
                                            new SimpleGrantedAuthority(
                                                    "ROLE_" + role
                                            )
                                    )
                            );

                    authentication.setDetails(
                            userId
                    );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(
                                    authentication
                            );
                }
            }
        }

        filterChain.doFilter(
                request,
                response
        );
    }
}