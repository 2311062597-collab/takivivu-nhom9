package com.example.hotelservice.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.*;
@Entity @Table(name="giu_phong_cu_the", indexes={@Index(name="idx_physical_hold_dates",columnList="phong_cu_the_id,ngay_nhan_phong,ngay_tra_phong")}) @Data
public class PhysicalRoomHold {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="phong_cu_the_id",nullable=false) private Long phongCuTheId;
 @Column(name="booking_id",nullable=false) private Long bookingId;
 @Column(name="ngay_nhan_phong",nullable=false) private LocalDate ngayNhanPhong;
 @Column(name="ngay_tra_phong",nullable=false) private LocalDate ngayTraPhong;
 @Enumerated(EnumType.STRING) @Column(name="trang_thai",nullable=false) private TrangThaiGiuPhong trangThai;
 @Column(name="het_han_luc",nullable=false) private LocalDateTime hetHanLuc;
}
