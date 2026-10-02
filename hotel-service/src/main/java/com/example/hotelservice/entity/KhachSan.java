package com.example.hotelservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "khach_san")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KhachSan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nha_cung_cap_id", nullable = false)
    private Long nhaCungCapId;

    @Column(name = "ten_khach_san", nullable = false, length = 255)
    private String tenKhachSan;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "dia_chi", nullable = false, length = 500)
    private String diaChi;

    @Column(name = "thanh_pho", nullable = false, length = 150)
    private String thanhPho;

    @Column(name = "so_dien_thoai", length = 20)
    private String soDienThoai;

    @Column(name = "email", length = 254)
    private String email;

    @Column(name = "hinh_anh", columnDefinition = "TEXT")
    private String hinhAnh;

    @Column(name = "vi_do", precision = 10, scale = 7)
    private BigDecimal viDo;

    @Column(name = "kinh_do", precision = 10, scale = 7)
    private BigDecimal kinhDo;

    @Column(name = "quan_huyen", length = 150)
    private String quanHuyen;

    @Column(name = "tien_nghi", columnDefinition = "TEXT")
    private String tienNghi;

    @Column(name = "anh_gioi_thieu", columnDefinition = "TEXT")
    private String anhGioiThieu;

    @Column(name = "anh_thu_vien", columnDefinition = "TEXT")
    private String anhThuVien;

    @Column(name = "so_tang", nullable = false)
    private Integer soTang;

    @Column(name = "so_sao")
    private Integer soSao;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiKhachSan trangThai;

    @Column(name = "ngay_tao", insertable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat", insertable = false, updatable = false)
    private LocalDateTime ngayCapNhat;
}