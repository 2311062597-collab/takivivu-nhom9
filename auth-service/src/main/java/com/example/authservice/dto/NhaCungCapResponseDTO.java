package com.example.authservice.dto;

import com.example.authservice.entity.LoaiNhaCungCap;
import com.example.authservice.entity.TrangThaiDuyet;
import com.example.authservice.entity.TrangThaiNguoiDung;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NhaCungCapResponseDTO {

    private Long providerProfileId;

    private Long nguoiDungId;

    private String hoTen;

    private String email;

    private String soDienThoai;

    private String tenDoanhNghiep;

    private String anhGiayPhepKinhDoanh;

    private LoaiNhaCungCap loaiNhaCungCap;

    private TrangThaiDuyet trangThaiDuyet;

    private TrangThaiNguoiDung trangThaiTaiKhoan;

    private String lyDoTuChoi;

    private String thongBao;
}
