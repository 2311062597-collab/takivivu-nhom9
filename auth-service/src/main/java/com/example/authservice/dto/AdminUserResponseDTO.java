package com.example.authservice.dto;

import com.example.authservice.entity.LoaiNhaCungCap;
import com.example.authservice.entity.TrangThaiDuyet;
import com.example.authservice.entity.TrangThaiNguoiDung;
import com.example.authservice.entity.VaiTro;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponseDTO {
    private Long id;
    private String hoTen;
    private String email;
    private String soDienThoai;
    private VaiTro vaiTro;
    private TrangThaiNguoiDung trangThai;
    private String anhDaiDien;
    private String diaChi;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;

    // Chỉ có dữ liệu khi tài khoản là PROVIDER.
    private Long providerProfileId;
    private String tenDoanhNghiep;
    private String anhGiayPhepKinhDoanh;
    private LoaiNhaCungCap loaiNhaCungCap;
    private TrangThaiDuyet trangThaiDuyet;
    private String lyDoTuChoi;
}
