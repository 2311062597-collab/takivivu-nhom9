package com.example.hotelservice.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data public class PhongCuTheRequest {
 @NotNull(message="Phải chọn loại phòng") private Long loaiPhongId;
 @NotBlank(message="Phải nhập số phòng") @Size(max=40) private String soPhong;
 @NotNull(message="Phải chọn tầng") @Min(value=1,message="Tầng phải từ 1") private Integer tang;
 private Boolean dangHoatDong=true;
}