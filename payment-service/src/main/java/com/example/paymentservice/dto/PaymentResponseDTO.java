package com.example.paymentservice.dto;

import com.example.paymentservice.entity.PhuongThucThanhToan;
import com.example.paymentservice.entity.TrangThaiPayment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDTO {

    private Long id;

    private String maThanhToan;

    private Long bookingId;

    private String maBooking;

    private Long khachHangId;

    private BigDecimal soTien;

    private PhuongThucThanhToan phuongThuc;

    private TrangThaiPayment trangThai;

    private String maNganHang;

    private String soTaiKhoan;

    private String tenTaiKhoan;

    private String noiDungChuyenKhoan;

    private String qrUrl;

    private String transactionCode;

    private String paypalOrderId;

    private String paypalCaptureId;

    private String paypalApprovalUrl;

    private String paypalCurrency;

    private BigDecimal paypalAmount;

    private LocalDateTime hetHanLuc;

    private LocalDateTime ngayTao;

    private LocalDateTime thanhToanLuc;

    private String payosPaymentLinkId;

    private String payosCheckoutUrl;
}
