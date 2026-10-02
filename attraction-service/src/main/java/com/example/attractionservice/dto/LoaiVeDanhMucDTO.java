package com.example.attractionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoaiVeDanhMucDTO {
    private String maLoaiVe;
    private String tenLoaiVe;
    private String doiTuongApDung;
    private Integer thuTu;
}
