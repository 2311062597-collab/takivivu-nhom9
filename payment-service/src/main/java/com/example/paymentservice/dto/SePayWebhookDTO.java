package com.example.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SePayWebhookDTO {

    @NotBlank(message = "transactionCode không được để trống")
    @JsonAlias({
            "referenceCode",
            "transactionCode"
    })
    private String transactionCode;

    @NotNull(message = "Số tiền giao dịch không được để trống")
    @Positive(message = "Số tiền giao dịch phải > 0")
    @JsonAlias({
            "transferAmount",
            "amount"
    })
    private BigDecimal amount;

    @JsonAlias({
            "content",
            "description"
    })
    private String content;

    @JsonAlias({
            "transactionDate",
            "transactionTime"
    })
    private LocalDateTime transactionTime;
}