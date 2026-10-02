package com.example.attractionservice.dto;

import com.example.attractionservice.entity.TrangThaiGiuVe;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiuVeResponseDTO {

    private Long id;
    private Long loaiVeId;
    private Long bookingId;
    private Integer soLuongVe;
    private LocalDate ngaySuDung;
    private TrangThaiGiuVe trangThai;
    private LocalDateTime hetHanLuc;
    private String thongBao;
}