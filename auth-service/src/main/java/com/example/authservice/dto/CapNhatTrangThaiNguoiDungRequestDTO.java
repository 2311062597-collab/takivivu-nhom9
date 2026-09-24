package com.example.authservice.dto;

import com.example.authservice.entity.TrangThaiNguoiDung;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CapNhatTrangThaiNguoiDungRequestDTO {

    @NotNull(message = "Trạng thái tài khoản không được để trống")
    private TrangThaiNguoiDung trangThai;
}
