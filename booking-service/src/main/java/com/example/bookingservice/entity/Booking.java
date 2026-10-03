package com.example.bookingservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "ma_booking",
            nullable = false,
            unique = true,
            length = 50
    )
    private String maBooking;

    @Column(name = "khach_hang_id", nullable = false)
    private Long khachHangId;

    @Column(
            name = "tong_tien_goc",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal tongTienGoc;

    @Column(
            name = "tong_tien",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal tongTien;

    @Column(name = "uu_dai_id")
    private Long uuDaiId;

    @Column(name = "ma_uu_dai", length = 50)
    private String maUuDai;

    @Column(name = "so_tien_giam", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTienGiam;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiBooking trangThai;

    @Column(name = "het_han_thanh_toan")
    private LocalDateTime hetHanThanhToan;

    @Column(name = "ly_do_huy", length = 500)
    private String lyDoHuy;

    @Column(name = "ly_do_tu_choi_huy", length = 500)
    private String lyDoTuChoiHuy;

    @Column(name = "han_xu_ly_huy")
    private LocalDateTime hanXuLyHuy;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

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

    @OneToMany(
            mappedBy = "booking",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<BookingItem> danhSachItem =
            new ArrayList<>();
}