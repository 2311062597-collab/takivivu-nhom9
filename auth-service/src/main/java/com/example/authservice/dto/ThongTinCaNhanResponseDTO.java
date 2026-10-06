package com.example.authservice.dto;

import com.example.authservice.entity.TrangThaiNguoiDung;
import com.example.authservice.entity.VaiTro;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThongTinCaNhanResponseDTO {

    private Long id;
    private String hoTen;
    private String email;
    private String soDienThoai;
    private VaiTro vaiTro;
    private TrangThaiNguoiDung trangThai;
    private String anhDaiDien;
    private String diaChi;

    private String tenDoanhNghiep;
    private String tenVietTat;
    private String moTaDoanhNghiep;
    private String maSoThue;
    private String namThanhLap;
    private String website;
    private String emailDoanhNghiep;
    private String soDienThoaiDoanhNghiep;
    private String diaChiDoanhNghiep;
    private String anhBia;
    private String logo;
}