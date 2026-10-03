package com.example.bookingservice.dto;

import com.example.bookingservice.entity.LoaiDichVu;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingItemResponseDTO {

    private Long id;

    private LoaiDichVu loaiDichVu;

    private Long dichVuId;

    private Long nhaCungCapId;

    private Integer soLuong;

    private BigDecimal donGia;

    private BigDecimal thanhTien;

    private LocalDate ngayBatDau;

    private LocalDate ngayKetThuc;

    private String thongTinBoSung;
}