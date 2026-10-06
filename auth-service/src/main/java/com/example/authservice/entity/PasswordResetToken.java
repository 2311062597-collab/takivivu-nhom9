package com.example.authservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    // auth_db hiện dùng quy ước tiếng Việt cho khóa ngoại người dùng.
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoi_dung_id", nullable = false)
    public User user;

    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    public String tokenHash;

    @Column(name = "het_han_luc", nullable = false)
    public LocalDateTime expiresAt;

    @Column(name = "da_su_dung", nullable = false)
    public boolean used;

    @Column(name = "ngay_tao", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "ngay_su_dung")
    public LocalDateTime usedAt;
}
