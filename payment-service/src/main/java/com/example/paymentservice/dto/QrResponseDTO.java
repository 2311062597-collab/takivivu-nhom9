package com.example.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QrResponseDTO {

    private Long paymentId;

    private String maPayment;

    private String maBooking;

    private String nganHang;

    private String soTaiKhoan;

    private String tenTaiKhoan;

    private BigDecimal soTien;

    private String noiDungChuyenKhoan;

    private String qrUrl;

    private LocalDateTime hetHanLuc;
}