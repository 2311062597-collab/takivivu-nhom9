package com.example.authservice.security;

import com.example.authservice.entity.ProviderProfile;
import com.example.authservice.entity.User;
import com.example.authservice.entity.VaiTro;
import com.example.authservice.repository.ProviderProfileRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private final ProviderProfileRepository providerProfileRepository;

    public JwtUtil(
            ProviderProfileRepository providerProfileRepository
    ) {
        this.providerProfileRepository = providerProfileRepository;
    }

    public String taoAccessToken(User user) {

        Date now = new Date();
        Date expiryDate =
                new Date(now.getTime() + jwtExpirationMs);

        var builder = Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getVaiTro().name())
                .issuedAt(now)
                .expiration(expiryDate);

        if (user.getVaiTro() == VaiTro.PROVIDER) {

            ProviderProfile providerProfile =
                    providerProfileRepository
                            .findByNguoiDungId(user.getId())
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy hồ sơ nhà cung cấp"
                                    )
                            );

            if (providerProfile.getLoaiNhaCungCap() == null) {
                throw new RuntimeException(
                        "Nhà cung cấp chưa được cấu hình loại nhà cung cấp"
                );
            }

            builder.claim(
                    "providerType",
                    providerProfile.getLoaiNhaCungCap().name()
            );
        }

        return builder
                .signWith(getSigningKey())
                .compact();
    }

    public String layEmailTuToken(String token) {

        return getClaims(token)
                .getSubject();
    }

    public boolean kiemTraToken(String token) {

        try {

            getClaims(token);
            return true;

        } catch (Exception e) {

            return false;
        }
    }

    private Claims getClaims(String token) {

        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {

        return Keys.hmacShaKeyFor(
                jwtSecret.getBytes(
                        StandardCharsets.UTF_8
                )
        );
    }
}
