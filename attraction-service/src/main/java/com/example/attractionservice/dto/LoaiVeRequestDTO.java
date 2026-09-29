package com.example.attractionservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoaiVeRequestDTO {

    @NotBlank(message = "Loại vé không được để trống")
    private String maLoaiVe;

    @NotBlank(message = "Mô tả loại vé không được để trống")
    @Size(max = 500, message = "Mô tả loại vé không được vượt quá 500 ký tự")
    private String moTa;

    @NotNull(message = "Giá vé không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá vé phải lớn hơn 0")
    @DecimalMax(value = "1000000000", message = "Giá vé không được vượt quá 1.000.000.000 VND")
    private BigDecimal giaVe;

    @NotNull(message = "Tổng số vé không được để trống")
    @Min(value = 1, message = "Tổng số vé phải lớn hơn 0")
    @Max(value = 1000000, message = "Tổng số vé không được vượt quá 1.000.000")
    private Integer tongSoVe;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate ngayBatDau;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate ngayKetThuc;
}
