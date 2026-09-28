package com.example.hotelservice.dto;

import com.example.hotelservice.entity.TrangThaiGiuPhong;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiuPhongResponseDTO {

    private Long id;

    private Long phongId;

    private Long bookingId;

    private Integer soLuongPhong;

    private LocalDate ngayNhanPhong;

    private LocalDate ngayTraPhong;

    private TrangThaiGiuPhong trangThai;

    private LocalDateTime hetHanLuc;

    private String thongBao;
}