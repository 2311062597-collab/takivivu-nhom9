package com.example.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebhookResponseDTO {

    private boolean thanhCong;

    private boolean daXuLyTruocDo;

    private String thongBao;

    private Long paymentId;
}