package com.example.hotelservice.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
@Entity @Table(name="phong_cu_the",uniqueConstraints=@UniqueConstraint(name="uk_phong_hotel_number",columnNames={"khach_san_id","so_phong"})) @Data
public class PhongCuThe {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="khach_san_id",nullable=false) private Long khachSanId;
 @Column(name="loai_phong_id",nullable=false) private Long loaiPhongId;
 @Column(name="so_phong",nullable=false,length=40) private String soPhong;
 @Column(name="tang",nullable=false) private Integer tang;
 @Column(name="gia_moi_dem",nullable=false) private BigDecimal giaMoiDem;
 @Column(name="hinh_anh",columnDefinition="TEXT") private String hinhAnh;
 @Column(name="dang_hoat_dong",nullable=false) private Boolean dangHoatDong=true;
}