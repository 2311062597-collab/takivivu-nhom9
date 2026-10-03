package com.example.promotionservice.dto;

import com.example.promotionservice.entity.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PromotionResponseDTO {
    private Long id;
    private Long providerId;
    private Long createdBy;
    private String providerName;
    private String name;
    private String code;
    private String description;
    private String imageUrl;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer maxUsage;
    private Integer maxUsagePerCustomer;
    private Integer usedCount;
    private PromotionStatus status;
    private ServiceType serviceType;
    private List<Long> serviceIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
