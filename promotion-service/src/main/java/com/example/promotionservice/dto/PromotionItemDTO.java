package com.example.promotionservice.dto;

import com.example.promotionservice.entity.ServiceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PromotionItemDTO {
    @NotNull
    private ServiceType serviceType;
    @NotNull
    private Long serviceId;
    @NotNull
    private Long providerId;
    @NotNull
    @DecimalMin("0.00")
    private BigDecimal amount;
}
