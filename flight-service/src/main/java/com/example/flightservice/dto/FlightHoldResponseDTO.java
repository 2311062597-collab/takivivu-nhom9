package com.example.flightservice.dto;

import com.example.flightservice.entity.TrangThaiHold;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlightHoldResponseDTO {

    private Long id;

    private Long chuyenBayId;

    private Long bookingId;

    private Integer soLuongGhe;

    private TrangThaiHold trangThai;

    private LocalDateTime hetHanLuc;

    private String thongBao;
}