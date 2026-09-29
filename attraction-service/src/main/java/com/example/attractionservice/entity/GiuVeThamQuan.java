package com.example.attractionservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "giu_ve_tham_quan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiuVeThamQuan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(
            name = "loai_ve_id",
            referencedColumnName = "id",
            nullable = false
    )
    private LoaiVeThamQuan loaiVe;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "so_luong_ve", nullable = false)
    private Integer soLuongVe;

    @Column(name = "ngay_su_dung", nullable = false)
    private LocalDate ngaySuDung;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiGiuVe trangThai;

    @Column(name = "het_han_luc", nullable = false)
    private LocalDateTime hetHanLuc;

    @Column(name = "ngay_tao", insertable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat", insertable = false, updatable = false)
    private LocalDateTime ngayCapNhat;
}