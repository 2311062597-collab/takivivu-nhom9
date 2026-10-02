package com.example.flightservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class FlightFareRequestDTO {
    @NotBlank(message="Hạng vé không được để trống") private String hangVe;
    @NotNull(message="Giá vé không được để trống") @DecimalMin(value="0.01", message="Giá vé phải lớn hơn 0") private BigDecimal giaVe;
    @NotNull(message="Số ghế không được để trống") @Min(value=1, message="Số ghế phải lớn hơn 0") private Integer soGhe;
}
