package com.example.hotelservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhongRequestDTO {

    @NotBlank(message = "Tên loại phòng không được để trống")
    private String tenLoaiPhong;

    private String moTa;

    @NotNull(message = "Giá mỗi đêm không được để trống")
    @DecimalMin(
            value = "0.0",
            inclusive = false,
            message = "Giá mỗi đêm phải lớn hơn 0"
    )
    private BigDecimal giaMoiDem;

    @NotNull(message = "Tổng số phòng không được để trống")
    @Min(value = 1, message = "Tổng số phòng phải lớn hơn 0")
    private Integer tongSoPhong;

    @NotNull(message = "Sức chứa không được để trống")
    @Min(value = 1, message = "Sức chứa phải lớn hơn 0")
    private Integer sucChua;
}