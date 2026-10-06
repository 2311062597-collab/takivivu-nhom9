package com.example.hotelservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "danh_gia_khach_san", uniqueConstraints = @UniqueConstraint(name = "uq_danh_gia_khach_san_booking_target", columnNames = {"booking_id", "khach_san_id"}))
@Data
public class DanhGiaKhachSan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "booking_id", nullable = false) private Long bookingId;
    @Column(name = "khach_san_id", nullable = false) private Long targetId;
    @Column(name = "so_sao", nullable = false) private Integer soSao;
    @Column(name = "noi_dung", length = 2000) private String noiDung;
    @Column(name = "ngay_tao", insertable = false, updatable = false) private LocalDateTime ngayTao;
}
