package com.example.authservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "provider_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProviderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(
            name = "nguoi_dung_id",
            referencedColumnName = "id",
            unique = true,
            nullable = false
    )
    private User nguoiDung;

    @Column(name = "ten_doanh_nghiep", nullable = false, length = 255)
    private String tenDoanhNghiep;


    @Column(name = "ten_viet_tat", length = 150)
    private String tenVietTat;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "ma_so_thue", length = 50)
    private String maSoThue;

    @Column(name = "nam_thanh_lap", length = 4)
    private String namThanhLap;

    @Column(name = "website", length = 500)
    private String website;

    @Column(name = "email_doanh_nghiep", length = 255)
    private String emailDoanhNghiep;

    @Column(name = "so_dien_thoai_doanh_nghiep", length = 30)
    private String soDienThoaiDoanhNghiep;

    @Column(name = "dia_chi_doanh_nghiep", length = 500)
    private String diaChiDoanhNghiep;

    @Column(name = "anh_bia", length = 1000)
    private String anhBia;

    @Column(name = "logo", length = 1000)
    private String logo;

    @Column(name = "anh_giay_phep_kinh_doanh", length = 500)
    private String anhGiayPhepKinhDoanh;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_nha_cung_cap", nullable = false, length = 30)
    private LoaiNhaCungCap loaiNhaCungCap;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai_duyet", nullable = false)
    private TrangThaiDuyet trangThaiDuyet;

    @ManyToOne
    @JoinColumn(
            name = "nguoi_duyet_id",
            referencedColumnName = "id"
    )
    private User nguoiDuyet;

    @Column(name = "ngay_duyet")
    private LocalDateTime ngayDuyet;

    @Column(name = "ly_do_tu_choi", length = 500)
    private String lyDoTuChoi;

    @Column(name = "ngay_tao", insertable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat", insertable = false, updatable = false)
    private LocalDateTime ngayCapNhat;
}
