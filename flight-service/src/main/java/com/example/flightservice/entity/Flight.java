package com.example.flightservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "flights")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "nha_cung_cap_id",
            nullable = false
    )
    private Long nhaCungCapId;

    @Column(
            name = "ma_chuyen_bay",
            nullable = false,
            unique = true,
            length = 50
    )
    private String maChuyenBay;

    @Column(
            name = "hang_hang_khong",
            nullable = false,
            length = 150
    )
    private String hangHangKhong;

    @Column(
            name = "diem_di",
            nullable = false,
            length = 150
    )
    private String diemDi;

    @Column(
            name = "diem_den",
            nullable = false,
            length = 150
    )
    private String diemDen;

    @Column(
            name = "san_bay_di",
            nullable = false,
            length = 255
    )
    private String sanBayDi;

    @Column(
            name = "san_bay_den",
            nullable = false,
            length = 255
    )
    private String sanBayDen;

    @Column(
            name = "thoi_gian_khoi_hanh",
            nullable = false
    )
    private LocalDateTime thoiGianKhoiHanh;

    @Column(
            name = "thoi_gian_den",
            nullable = false
    )
    private LocalDateTime thoiGianDen;

    @Column(name = "hang_ve", nullable = false, length = 50)
    private String hangVe;

    @Column(
            name = "gia_ve",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal giaVe;

    @Column(
            name = "tong_so_ghe",
            nullable = false
    )
    private Integer tongSoGhe;

    @Column(
            name = "so_ghe_con_lai",
            nullable = false
    )
    private Integer soGheConLai;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "trang_thai",
            nullable = false
    )
    private TrangThaiChuyenBay trangThai;

    @Column(
            name = "ngay_tao",
            insertable = false,
            updatable = false
    )
    private LocalDateTime ngayTao;

    @Column(
            name = "ngay_cap_nhat",
            insertable = false,
            updatable = false
    )
    private LocalDateTime ngayCapNhat;
}