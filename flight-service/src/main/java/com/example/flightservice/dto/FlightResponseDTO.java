package com.example.flightservice.dto;

import com.example.flightservice.entity.TrangThaiChuyenBay;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlightResponseDTO {

    private Long id;

    private Long nhaCungCapId;

    private String maChuyenBay;

    private String hangHangKhong;

    private String diemDi;

    private String diemDen;

    private String sanBayDi;

    private String sanBayDen;

    private LocalDateTime thoiGianKhoiHanh;

    private LocalDateTime thoiGianDen;

    private String hangVe;

    private BigDecimal giaVe;

    private Integer tongSoGhe;

    private Integer soGheConLai;

    private TrangThaiChuyenBay trangThai;
}