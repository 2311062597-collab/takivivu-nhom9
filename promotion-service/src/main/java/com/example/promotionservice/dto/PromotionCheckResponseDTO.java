package com.example.promotionservice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PromotionCheckResponseDTO {
    private boolean valid;
    private Long promotionId;
    private String promotionCode;
    private BigDecimal originalAmount;
    private BigDecimal eligibleAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String message;
}
