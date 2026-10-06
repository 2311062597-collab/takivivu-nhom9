package com.example.flightservice.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
@Entity @Table(name="danh_gia_chuyen_bay", uniqueConstraints=@UniqueConstraint(name="uq_danh_gia_chuyen_bay_booking_target",columnNames={"booking_id", "flight_id"})) @Data
public class DanhGiaChuyenBay {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_id",nullable=false) private Long userId;
 @Column(name="booking_id",nullable=false) private Long bookingId;
 @Column(name="flight_id",nullable=false) private Long targetId;
 @Column(name="so_sao",nullable=false) private Integer soSao;
 @Column(name="noi_dung",columnDefinition="TEXT") private String noiDung;
 @Column(name="ngay_tao",insertable=false,updatable=false) private LocalDateTime ngayTao;
}
