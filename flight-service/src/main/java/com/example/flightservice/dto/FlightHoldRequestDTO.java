package com.example.flightservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlightHoldRequestDTO {

    @NotNull(
            message = "Booking ID không được để trống"
    )
    private Long bookingId;

    @NotNull(
            message = "Số lượng ghế không được để trống"
    )
    @Min(
            value = 1,
            message = "Số lượng ghế phải lớn hơn 0"
    )
    private Integer soLuongGhe;

    /**
     * Danh sách mã ghế khách đã chọn. Với luồng cũ có thể để trống và hệ thống
     * sẽ giữ số lượng ghế bất kỳ còn trống.
     */
    private List<String> seatCodes;
}