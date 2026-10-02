package com.example.attractionservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "danh_muc_loai_ve_tham_quan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DanhMucLoaiVeThamQuan {

    @Id
    @Column(name = "ma_loai_ve", length = 30)
    private String maLoaiVe;

    @Column(name = "ten_loai_ve", nullable = false, length = 150)
    private String tenLoaiVe;

    @Column(name = "doi_tuong_ap_dung", nullable = false, length = 255)
    private String doiTuongApDung;

    @Column(name = "thu_tu", nullable = false)
    private Integer thuTu;

    @Column(name = "active", nullable = false)
    private Boolean active;
}
