package com.example.hotelservice.dto;

import com.example.hotelservice.entity.TrangThaiPhong;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhongResponseDTO {

    private Long id;

    private Long khachSanId;

    private String tenLoaiPhong;

    private String moTa;

    private BigDecimal giaMoiDem;

    private Integer tongSoPhong;

    private Integer soPhongConLai;

    private Integer sucChua;

    private TrangThaiPhong trangThai;
}