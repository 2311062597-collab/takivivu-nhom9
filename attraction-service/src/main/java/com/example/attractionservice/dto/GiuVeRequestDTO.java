package com.example.attractionservice.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Max;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiuVeRequestDTO {

    @NotNull(message = "Booking ID không được để trống")
    @Positive(message = "Booking ID không hợp lệ")
    private Long bookingId;

    @NotNull(message = "Số lượng vé không được để trống")
    @Min(value = 1, message = "Số lượng vé phải lớn hơn 0")
    @Max(value = 1000, message = "Mỗi lần đặt không được vượt quá 1.000 vé")
    private Integer soLuongVe;

    @NotNull(message = "Ngày sử dụng không được để trống")
    @FutureOrPresent(message = "Ngày sử dụng không được ở trong quá khứ")
    private LocalDate ngaySuDung;
}