package com.example.paymentservice.dto;

import com.example.paymentservice.entity.PhuongThucThanhToan;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaoPaymentRequestDTO {

    @NotNull(message = "bookingId không được để trống")
    private Long bookingId;

    private String idempotencyKey;

    private PhuongThucThanhToan phuongThuc;
}