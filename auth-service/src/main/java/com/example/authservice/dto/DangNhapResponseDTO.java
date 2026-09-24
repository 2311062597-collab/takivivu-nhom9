package com.example.authservice.dto;

import com.example.authservice.entity.LoaiNhaCungCap;
import com.example.authservice.entity.TrangThaiNguoiDung;
import com.example.authservice.entity.VaiTro;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DangNhapResponseDTO {

    private Long id;

    private String hoTen;

    private String email;

    private VaiTro vaiTro;

    private LoaiNhaCungCap loaiNhaCungCap;

    private TrangThaiNguoiDung trangThai;

    private String accessToken;

    private String refreshToken;
}
