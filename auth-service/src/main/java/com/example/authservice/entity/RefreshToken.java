package com.example.authservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(
            name = "nguoi_dung_id",
            referencedColumnName = "id",
            nullable = false
    )
    private User nguoiDung;

    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    private String tokenHash;

    @Column(name = "het_han_luc", nullable = false)
    private LocalDateTime hetHanLuc;

    @Column(name = "da_thu_hoi", nullable = false)
    private Boolean daThuHoi;

    @Column(name = "ngay_tao", insertable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_thu_hoi")
    private LocalDateTime ngayThuHoi;
}