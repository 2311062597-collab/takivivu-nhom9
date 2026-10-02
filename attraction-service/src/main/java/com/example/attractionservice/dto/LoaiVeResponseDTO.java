package com.example.attractionservice.dto;

import com.example.attractionservice.entity.TrangThaiLoaiVe;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoaiVeResponseDTO {

    private Long id;
    private Long diaDiemId;
    private String maLoaiVe;
    private String tenLoaiVe;
    private String doiTuongApDung;
    private String moTa;
    private BigDecimal giaVe;
    private Integer tongSoVe;
    private Integer soVeConLai;
    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;
    private TrangThaiLoaiVe trangThai;
}
