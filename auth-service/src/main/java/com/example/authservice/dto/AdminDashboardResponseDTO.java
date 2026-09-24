package com.example.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponseDTO {

    private long tongNguoiDung;
    private long tongKhachHang;
    private long tongNhaCungCap;
    private long nhaCungCapChoDuyet;
    private long nhaCungCapDaDuyet;
    private long nhaCungCapBiTuChoi;
    private long taiKhoanDangHoatDong;
    private long taiKhoanBiKhoa;
}
