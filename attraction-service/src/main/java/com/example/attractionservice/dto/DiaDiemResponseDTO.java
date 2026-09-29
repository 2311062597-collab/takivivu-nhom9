package com.example.attractionservice.dto;

import com.example.attractionservice.entity.TrangThaiDiaDiem;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiaDiemResponseDTO {

    private Long id;
    private Long nhaCungCapId;
    private String tenDiaDiem;
    private String moTa;
    private String diaChi;
    private String quanHuyen;
    private String thanhPho;
    private String loaiDiaDiem;
    private List<String> tienIch;
    private BigDecimal viDo;
    private BigDecimal kinhDo;
    private String placeId;
    private LocalTime gioMoCua;
    private LocalTime gioDongCua;
    private String hinhAnh;
    private TrangThaiDiaDiem trangThai;

    private List<LoaiVeResponseDTO> danhSachLoaiVe;
}
