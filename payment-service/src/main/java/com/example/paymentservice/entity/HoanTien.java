package com.example.paymentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "hoan_tien")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoanTien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "ma_hoan_tien",
            nullable = false,
            unique = true
    )
    private String maHoanTien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "thanh_toan_id",
            nullable = false
    )
    private Payment payment;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "booking_item_id")
    private Long bookingItemId;

    @Column(
            name = "so_tien",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal soTien;

    @Column(name = "ly_do", length = 500)
    private String lyDo;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiHoanTien trangThai;

    @Column(
            name = "refund_transaction_code",
            length = 150
    )
    private String refundTransactionCode;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    @Column(
            name = "ngay_tao",
            insertable = false,
            updatable = false
    )
    private LocalDateTime ngayTao;

    @Column(name = "hoan_tien_luc")
    private LocalDateTime hoanTienLuc;
}