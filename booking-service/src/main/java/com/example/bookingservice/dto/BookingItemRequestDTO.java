package com.example.bookingservice.dto;

import com.example.bookingservice.entity.LoaiDichVu;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingItemRequestDTO {

    @NotNull(message = "Loại dịch vụ không được để trống")
    private LoaiDichVu loaiDichVu;

    @NotNull(message = "ID dịch vụ không được để trống")
    private Long dichVuId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer soLuong;

    private LocalDate ngayBatDau;

    private LocalDate ngayKetThuc;

    private String thongTinBoSung;
}