package com.example.attractionservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "dia_diem_tham_quan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiaDiemThamQuan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nha_cung_cap_id", nullable = false)
    private Long nhaCungCapId;

    @Column(name = "ten_dia_diem", nullable = false, length = 255)
    private String tenDiaDiem;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "dia_chi", length = 500)
    private String diaChi;

    @Column(name = "quan_huyen", length = 150)
    private String quanHuyen;

    @Column(name = "thanh_pho", nullable = false, length = 150)
    private String thanhPho;

    @Column(name = "loai_dia_diem", length = 150)
    private String loaiDiaDiem;

    @Column(name = "tien_ich", columnDefinition = "TEXT")
    private String tienIch;

    @Column(name = "vi_do", precision = 10, scale = 7)
    private BigDecimal viDo;

    @Column(name = "kinh_do", precision = 10, scale = 7)
    private BigDecimal kinhDo;

    @Column(name = "place_id", length = 255)
    private String placeId;

    @Column(name = "gio_mo_cua", nullable = false)
    private LocalTime gioMoCua;

    @Column(name = "gio_dong_cua", nullable = false)
    private LocalTime gioDongCua;

    @Column(name = "hinh_anh", length = 1000)
    private String hinhAnh;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiDiaDiem trangThai;

    @Column(name = "ngay_tao", insertable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat", insertable = false, updatable = false)
    private LocalDateTime ngayCapNhat;
}