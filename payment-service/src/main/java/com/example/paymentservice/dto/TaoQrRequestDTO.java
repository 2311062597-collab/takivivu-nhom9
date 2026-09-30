package com.example.paymentservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaoQrRequestDTO {

    @NotNull(message = "paymentId không được để trống")
    private Long paymentId;
}