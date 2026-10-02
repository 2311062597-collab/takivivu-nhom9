package com.example.hotelservice.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
@Data public class LoaiPhongRequest {
 @NotBlank private String tenLoaiPhong;
 @NotBlank private String moTa;
 @NotNull @DecimalMin(value="0.0",inclusive=false) private Double dienTich;
 @NotNull @Min(1) private Integer soNguoiLon;
 @NotNull @Min(0) private Integer soTreEm;
 @NotBlank private String loaiGiuong;
 @NotNull @Min(1) private Integer soLuongGiuong;
 private String tienNghi;
 @NotNull @DecimalMin(value="0.0",inclusive=false) private BigDecimal giaCoBan;
 @NotBlank private String hinhAnh;
 private String anhThuVien;
 private Boolean dangKinhDoanh=true;
}