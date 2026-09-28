package com.example.hotelservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KhachSanRequestDTO {

    @NotBlank(message = "Tên khách sạn không được để trống")
    private String tenKhachSan;

    private String moTa;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String diaChi;

    @NotBlank(message = "Thành phố không được để trống")
    private String thanhPho;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String soDienThoai;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 254, message = "Email không được vượt quá 254 ký tự")
    private String email;

    @NotBlank(message = "Quận/huyện không được để trống")
    private String quanHuyen;

    @NotBlank(message = "Tiện nghi không được để trống")
    private String tienNghi;

    @NotBlank(message = "Ảnh giới thiệu không được để trống")
    private String anhGioiThieu;

    private String anhThuVien;

    @NotBlank(message = "Ảnh đại diện không được để trống")
    private String hinhAnh;

    @DecimalMin(value = "-90.0", message = "Latitude phải >= -90")
    @DecimalMax(value = "90.0", message = "Latitude phải <= 90")
    private BigDecimal viDo;

    @DecimalMin(value = "-180.0", message = "Longitude phải >= -180")
    @DecimalMax(value = "180.0", message = "Longitude phải <= 180")
    private BigDecimal kinhDo;

    @jakarta.validation.constraints.NotNull(message = "Số tầng không được để trống")
    @Min(value = 1, message = "Số tầng phải lớn hơn 0")
    private Integer soTang;

    @Min(value = 1, message = "Số sao tối thiểu là 1")
    @Max(value = 5, message = "Số sao tối đa là 5")
    private Integer soSao;
}