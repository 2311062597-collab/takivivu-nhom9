package com.example.hotelservice.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
@Entity @Table(name="loai_phong", uniqueConstraints=@UniqueConstraint(name="uk_loai_phong_hotel_name",columnNames={"khach_san_id","ten_loai_phong"})) @Data
public class LoaiPhong {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="khach_san_id",nullable=false) private Long khachSanId;
 @Column(name="ten_loai_phong",nullable=false) private String tenLoaiPhong;
 @Column(name="mo_ta",nullable=false,columnDefinition="TEXT") private String moTa;
 @Column(name="dien_tich",nullable=false) private Double dienTich;
 @Column(name="so_nguoi_lon",nullable=false) private Integer soNguoiLon;
 @Column(name="so_tre_em",nullable=false) private Integer soTreEm;
 @Column(name="loai_giuong",nullable=false) private String loaiGiuong;
 @Column(name="so_luong_giuong",nullable=false) private Integer soLuongGiuong;
 @Column(name="tien_nghi",columnDefinition="TEXT") private String tienNghi;
 @Column(name="gia_co_ban",nullable=false) private BigDecimal giaCoBan;
 @Column(name="hinh_anh",nullable=false,columnDefinition="TEXT") private String hinhAnh;
 @Column(name="anh_thu_vien",columnDefinition="TEXT") private String anhThuVien;
 @Column(name="dang_kinh_doanh",nullable=false) private Boolean dangKinhDoanh=true;
}