package com.example.bookingservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequestDTO {

    private String idempotencyKey;

    private String promotionCode;

    @Valid
    @NotEmpty(
            message = "Booking phải có ít nhất một dịch vụ"
    )
    private List<BookingItemRequestDTO> danhSachDichVu;
}