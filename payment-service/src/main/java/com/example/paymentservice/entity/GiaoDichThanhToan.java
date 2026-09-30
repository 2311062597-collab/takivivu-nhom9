package com.example.paymentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "giao_dich_thanh_toan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiaoDichThanhToan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thanh_toan_id")
    private Payment payment;

    @Column(
            name = "transaction_code",
            nullable = false,
            unique = true,
            length = 150
    )
    private String transactionCode;

    @Column(
            name = "so_tien",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal soTien;

    @Column(
            name = "noi_dung_chuyen_khoan",
            length = 500
    )
    private String noiDungChuyenKhoan;

    @Column(
            name = "ma_booking_phat_hien",
            length = 50
    )
    private String maBookingPhatHien;

    @Column(name = "thoi_gian_giao_dich")
    private LocalDateTime thoiGianGiaoDich;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "ket_qua_doi_soat",
            nullable = false
    )
    private KetQuaDoiSoat ketQuaDoiSoat;

    @Column(name = "du_lieu_goc", columnDefinition = "TEXT")
    private String duLieuGoc;

    @Column(
            name = "ngay_tao",
            insertable = false,
            updatable = false
    )
    private LocalDateTime ngayTao;
}