package com.example.bookingservice.dto;

import com.example.bookingservice.entity.TrangThaiBooking;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrangThaiRequestDTO {

    @NotNull(message = "Trạng thái không được để trống")
    private TrangThaiBooking trangThai;
}