package com.example.flightservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlightRequestDTO {

    // Khi tạo mới mã được hệ thống tự sinh; khi cập nhật giữ nguyên mã hiện tại.
    private String maChuyenBay;

    @NotBlank(
            message = "Hãng hàng không không được để trống"
    )
    private String hangHangKhong;

    @NotBlank(
            message = "Điểm đi không được để trống"
    )
    private String diemDi;

    @NotBlank(
            message = "Điểm đến không được để trống"
    )
    private String diemDen;

    @NotBlank(
            message = "Sân bay đi không được để trống"
    )
    private String sanBayDi;

    @NotBlank(
            message = "Sân bay đến không được để trống"
    )
    private String sanBayDen;

    @NotNull(
            message = "Thời gian khởi hành không được để trống"
    )
    private LocalDateTime thoiGianKhoiHanh;

    @NotNull(
            message = "Thời gian đến không được để trống"
    )
    private LocalDateTime thoiGianDen;

    @NotBlank(message = "Hạng vé không được để trống")
    private String hangVe;

    @NotNull(
            message = "Giá vé không được để trống"
    )
    @DecimalMin(
            value = "0.0",
            inclusive = false,
            message = "Giá vé phải lớn hơn 0"
    )
    private BigDecimal giaVe;

    @NotNull(
            message = "Tổng số ghế không được để trống"
    )
    @Min(
            value = 1,
            message = "Tổng số ghế phải lớn hơn 0"
    )
    private Integer tongSoGhe;

    private List<FlightFareRequestDTO> hangVes = new ArrayList<>();
}