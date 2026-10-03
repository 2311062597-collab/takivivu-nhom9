package com.example.promotionservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PromotionCheckRequestDTO {
    @NotBlank
    private String code;

    private Long bookingId;

    @NotNull
    private Long customerId;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal totalAmount;

    @Valid
    @NotEmpty
    private List<PromotionItemDTO> items;
}
