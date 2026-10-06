package com.example.attractionservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "danh_gia_dia_diem", uniqueConstraints = @UniqueConstraint(name = "uq_danh_gia_dia_diem_booking_target", columnNames = {"booking_id", "dia_diem_id"}))
@Data
public class DanhGiaDiaDiem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "booking_id", nullable = false) private Long bookingId;
    @Column(name = "dia_diem_id", nullable = false) private Long targetId;
    @Column(name = "so_sao", nullable = false) private Integer soSao;
    @Column(name = "noi_dung", length = 2000) private String noiDung;
    @Column(name = "ngay_tao", insertable = false, updatable = false) private LocalDateTime ngayTao;
}
