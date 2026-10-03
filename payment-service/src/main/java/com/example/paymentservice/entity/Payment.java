package com.example.paymentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "thanh_toan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "ma_thanh_toan",
            nullable = false,
            unique = true,
            length = 50
    )
    private String maThanhToan;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(
            name = "ma_booking",
            nullable = false,
            length = 50
    )
    private String maBooking;

    @Column(name = "khach_hang_id", nullable = false)
    private Long khachHangId;

    @Column(
            name = "so_tien",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal soTien;

    @Enumerated(EnumType.STRING)
    @Column(name = "phuong_thuc", nullable = false)
    private PhuongThucThanhToan phuongThuc;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiPayment trangThai;

    @Column(name = "ma_ngan_hang")
    private String maNganHang;

    @Column(name = "so_tai_khoan")
    private String soTaiKhoan;

    @Column(name = "ten_tai_khoan")
    private String tenTaiKhoan;

    @Column(
            name = "noi_dung_chuyen_khoan",
            length = 100
    )
    private String noiDungChuyenKhoan;

    @Column(name = "qr_url", columnDefinition = "TEXT")
    private String qrUrl;

    @Column(name = "transaction_code", length = 150)
    private String transactionCode;

    @Column(name = "paypal_order_id", length = 50)
    private String paypalOrderId;

    @Column(name = "paypal_capture_id", length = 50)
    private String paypalCaptureId;

    @Column(name = "paypal_approval_url", columnDefinition = "TEXT")
    private String paypalApprovalUrl;

    @Column(name = "paypal_currency", length = 3)
    private String paypalCurrency;

    @Column(name = "paypal_amount", precision = 15, scale = 2)
    private BigDecimal paypalAmount;

    @Column(name = "het_han_luc")
    private LocalDateTime hetHanLuc;

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

    @Column(name = "thanh_toan_luc")
    private LocalDateTime thanhToanLuc;
}