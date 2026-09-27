package com.example.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CapNhatThongTinRequestDTO {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
    private String hoTen;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
            regexp = "^\\d{10}$",
            message = "Số điện thoại phải gồm đúng 10 chữ số"
    )
    private String soDienThoai;

    @Size(max = 500, message = "Đường dẫn ảnh đại diện không được vượt quá 500 ký tự")
    private String anhDaiDien;

    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    private String diaChi;
}