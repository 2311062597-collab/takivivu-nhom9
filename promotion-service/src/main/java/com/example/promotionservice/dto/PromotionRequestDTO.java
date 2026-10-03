package com.example.promotionservice.dto;

import com.example.promotionservice.entity.DiscountType;
import com.example.promotionservice.entity.ServiceType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class PromotionRequestDTO {
    @NotBlank(message = "Tên ưu đãi là bắt buộc")
    @Size(min = 3, max = 150, message = "Tên ưu đãi phải từ 3 đến 150 ký tự")
    private String name;

    @NotBlank(message = "Mã ưu đãi là bắt buộc")
    @Size(max = 50, message = "Mã ưu đãi tối đa 50 ký tự")
    private String code;

    @Size(max = 500, message = "Mô tả ưu đãi tối đa 500 ký tự")
    private String description;

    private String imageUrl;

    @NotNull(message = "Loại giảm giá là bắt buộc")
    private DiscountType discountType;

    @NotNull(message = "Giá trị giảm là bắt buộc")
    @DecimalMin(value = "0.01", message = "Giá trị giảm phải > 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.00", message = "Giá trị đơn tối thiểu phải >= 0")
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.01", message = "Mức giảm tối đa phải > 0")
    private BigDecimal maxDiscountAmount;

    @NotNull(message = "Ngày bắt đầu là bắt buộc")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc là bắt buộc")
    private LocalDate endDate;

    @Min(value = 1, message = "Giới hạn lượt sử dụng phải > 0")
    private Integer maxUsage;

    @Min(value = 1, message = "Giới hạn mỗi khách hàng phải > 0")
    private Integer maxUsagePerCustomer;

    @NotNull(message = "Dịch vụ áp dụng là bắt buộc")
    private ServiceType serviceType;

    private List<Long> serviceIds = new ArrayList<>();
}
