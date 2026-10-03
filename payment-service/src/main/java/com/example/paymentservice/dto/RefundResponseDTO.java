package com.example.paymentservice.dto;

import com.example.paymentservice.entity.TrangThaiHoanTien;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefundResponseDTO {

    private Long id;

    private String maHoanTien;

    private Long paymentId;

    private Long bookingId;

    private Long bookingItemId;

    private BigDecimal soTien;

    private String lyDo;

    private TrangThaiHoanTien trangThai;

    private String refundTransactionCode;

    private LocalDateTime ngayTao;

    private LocalDateTime hoanTienLuc;
}