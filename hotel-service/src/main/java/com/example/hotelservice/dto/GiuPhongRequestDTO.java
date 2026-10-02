package com.example.hotelservice.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class GiuPhongRequestDTO {

    @NotNull(message = "Booking ID không được để trống")
    private Long bookingId;

    // Optional exact physical room selected by customer.
    private Long phongCuTheId;

    @NotNull(message = "Số lượng phòng không được để trống")
    @Min(value = 1, message = "Số lượng phòng phải lớn hơn 0")
    private Integer soLuongPhong;

    @NotNull(message = "Ngày nhận phòng không được để trống")
    @FutureOrPresent(
            message = "Ngày nhận phòng không được nằm trong quá khứ"
    )
    private LocalDate ngayNhanPhong;

    @NotNull(message = "Ngày trả phòng không được để trống")
    private LocalDate ngayTraPhong;
}