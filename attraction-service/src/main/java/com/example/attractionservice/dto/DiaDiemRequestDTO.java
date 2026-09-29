package com.example.attractionservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiaDiemRequestDTO {

    @NotBlank(message = "Tên địa điểm không được để trống")
    @Size(min = 2, max = 150, message = "Tên địa điểm phải từ 2 đến 150 ký tự")
    private String tenDiaDiem;

    @Size(max = 1000, message = "Mô tả không được vượt quá 1000 ký tự")
    private String moTa;

    @Size(max = 255, message = "Địa chỉ cụ thể không được vượt quá 255 ký tự")
    private String diaChi;

    @NotBlank(message = "Quận/huyện không được để trống")
    @Size(max = 100, message = "Quận/huyện không được vượt quá 100 ký tự")
    private String quanHuyen;

    @NotBlank(message = "Thành phố không được để trống")
    @Size(max = 100, message = "Thành phố không được vượt quá 100 ký tự")
    private String thanhPho;

    @NotBlank(message = "Loại địa điểm không được để trống")
    private String loaiDiaDiem;

    private List<String> tienIch;

    @DecimalMin(value = "-90.0", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal viDo;

    @DecimalMin(value = "-180.0", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180.0", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal kinhDo;

    @Size(max = 255, message = "Place ID không được vượt quá 255 ký tự")
    private String placeId;

    @NotNull(message = "Giờ mở cửa không được để trống")
    private LocalTime gioMoCua;

    @NotNull(message = "Giờ đóng cửa không được để trống")
    private LocalTime gioDongCua;

    @NotBlank(message = "Địa điểm phải có ít nhất một hình ảnh")
    @Size(max = 1000, message = "Đường dẫn hình ảnh không hợp lệ")
    private String hinhAnh;
}
