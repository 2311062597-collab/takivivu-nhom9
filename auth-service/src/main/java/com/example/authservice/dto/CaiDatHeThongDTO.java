package com.example.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class CaiDatHeThongDTO {
    private String khoa;
    private String giaTri;
    private String kieuDuLieu;
    private String nhom;
    private String moTa;
    private LocalDateTime ngayCapNhat;
}
