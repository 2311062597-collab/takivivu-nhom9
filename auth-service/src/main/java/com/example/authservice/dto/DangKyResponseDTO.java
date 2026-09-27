package com.example.authservice.dto;

import com.example.authservice.entity.TrangThaiNguoiDung;
import com.example.authservice.entity.VaiTro;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DangKyResponseDTO {

    private Long id;

    private String hoTen;

    private String email;

    private String soDienThoai;

    private VaiTro vaiTro;

    private TrangThaiNguoiDung trangThai;

    private String thongBao;
}