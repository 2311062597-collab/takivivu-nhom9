package com.example.authservice.service;

import com.example.authservice.dto.*;
import com.example.authservice.entity.PasswordResetToken;
import com.example.authservice.entity.User;
import com.example.authservice.repository.PasswordResetTokenRepository;
import com.example.authservice.repository.RefreshTokenRepository;
import com.example.authservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
public class PasswordResetService {
    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder encoder;
    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();
    @Value("${auth.reset.frontend-url}") private String frontendUrl;
    @Value("${spring.mail.username:}") private String sender;

    public PasswordResetService(UserRepository users, PasswordResetTokenRepository tokens,
            RefreshTokenRepository refreshTokens, PasswordEncoder encoder, JavaMailSender mailSender) {
        this.users = users; this.tokens = tokens; this.refreshTokens = refreshTokens;
        this.encoder = encoder; this.mailSender = mailSender;
    }

    @Transactional
    public void request(ForgotPasswordRequestDTO request) {
        User user = users.findByEmailIgnoreCase(request.email().trim()).orElse(null);
        if (user == null) return; // Same response for registered and unknown addresses.
        if (sender.isBlank()) throw new IllegalStateException("Chưa cấu hình SMTP để gửi email đặt lại mật khẩu");
        // Slow repeated requests without disclosing whether the address exists.
        PasswordResetToken previous = tokens.findTopByUser_IdOrderByCreatedAtDesc(user.getId()).orElse(null);
        if (previous != null && previous.createdAt.isAfter(LocalDateTime.now().minusMinutes(1))) return;
        tokens.deleteByUser_Id(user.getId());
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        String secret = HexFormat.of().formatHex(bytes);
        PasswordResetToken token = new PasswordResetToken();
        token.user = user; token.tokenHash = hash(secret);
        token.createdAt = LocalDateTime.now(); token.expiresAt = token.createdAt.plusMinutes(15); token.used = false;
        tokens.save(token);
        SimpleMailMessage email = new SimpleMailMessage();
        email.setFrom(sender); email.setTo(user.getEmail());
        email.setSubject("TAKIVIVU - Dat lai mat khau");
        email.setText("Mo lien ket sau de dat lai mat khau (hieu luc 15 phut):\n"
                + frontendUrl + "?token=" + URLEncoder.encode(secret, StandardCharsets.UTF_8)
                + "\nNeu ban khong yeu cau, hay bo qua email nay.");
        mailSender.send(email);
    }

    @Transactional
    public void reset(ResetPasswordRequestDTO request) {
        PasswordResetToken token = tokens.findByTokenHash(hash(request.token()))
                .orElseThrow(() -> new IllegalArgumentException("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"));
        if (token.used || token.usedAt != null || !token.expiresAt.isAfter(LocalDateTime.now()))
            throw new IllegalArgumentException("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
        User user = token.user;
        user.setMatKhauMaHoa(encoder.encode(request.newPassword()));
        users.save(user);
        token.used = true; token.usedAt = LocalDateTime.now(); tokens.save(token);
        refreshTokens.deleteByNguoiDungId(user.getId());
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
}
