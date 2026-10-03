package com.example.bookingservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "booking_id",
            nullable = false
    )
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_dich_vu", nullable = false)
    private LoaiDichVu loaiDichVu;

    @Column(name = "dich_vu_id", nullable = false)
    private Long dichVuId;

    @Column(name = "nha_cung_cap_id")
    private Long nhaCungCapId;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(
            name = "don_gia",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal donGia;

    @Column(
            name = "thanh_tien",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal thanhTien;

    @Column(name = "ngay_bat_dau")
    private LocalDate ngayBatDau;

    @Column(name = "ngay_ket_thuc")
    private LocalDate ngayKetThuc;

    @Column(name = "thong_tin_bo_sung", columnDefinition = "TEXT")
    private String thongTinBoSung;

    @Column(
            name = "ngay_tao",
            insertable = false,
            updatable = false
    )
    private LocalDateTime ngayTao;
}