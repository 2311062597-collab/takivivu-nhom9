package com.example.aiservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingHelpRequestDTO {

    @NotBlank(message = "Nội dung yêu cầu không được để trống")
    @Size(max = 2000)
    private String message;

    private String bookingCode;
}