package com.example.attractionservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "loai_ve_tham_quan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoaiVeThamQuan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(
            name = "dia_diem_id",
            referencedColumnName = "id",
            nullable = false
    )
    private DiaDiemThamQuan diaDiem;

    @Column(name = "ma_loai_ve", nullable = false, length = 30)
    private String maLoaiVe;

    @Column(name = "ten_loai_ve", nullable = false, length = 150)
    private String tenLoaiVe;

    @Column(name = "doi_tuong_ap_dung", nullable = false, length = 255)
    private String doiTuongApDung;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "gia_ve", nullable = false, precision = 15, scale = 2)
    private BigDecimal giaVe;

    @Column(name = "tong_so_ve", nullable = false)
    private Integer tongSoVe;

    @Column(name = "so_ve_con_lai", nullable = false)
    private Integer soVeConLai;

    @Column(name = "ngay_bat_dau", nullable = false)
    private LocalDate ngayBatDau;

    @Column(name = "ngay_ket_thuc", nullable = false)
    private LocalDate ngayKetThuc;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiLoaiVe trangThai;

    @Column(name = "ngay_tao", insertable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat", insertable = false, updatable = false)
    private LocalDateTime ngayCapNhat;
}