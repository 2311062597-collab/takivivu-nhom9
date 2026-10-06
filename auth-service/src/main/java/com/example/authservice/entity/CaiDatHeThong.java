package com.example.authservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "cai_dat_he_thong")
@Data
@NoArgsConstructor
public class CaiDatHeThong {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "khoa", nullable = false, unique = true, length = 100)
    private String khoa;
    @Column(name = "gia_tri", length = 1000)
    private String giaTri;
    @Column(name = "kieu_du_lieu", nullable = false, length = 20)
    private String kieuDuLieu;
    @Column(name = "nhom", nullable = false, length = 30)
    private String nhom;
    @Column(name = "mo_ta", length = 500)
    private String moTa;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoi_cap_nhat_id")
    private User nguoiCapNhat;
    @Column(name = "ngay_cap_nhat", insertable = false, updatable = false)
    private LocalDateTime ngayCapNhat;
}
