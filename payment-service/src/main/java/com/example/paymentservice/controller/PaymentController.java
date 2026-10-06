package com.example.paymentservice.controller;

import com.example.paymentservice.dto.*;
import com.example.paymentservice.service.PaymentService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(
            PaymentService paymentService
    ) {
        this.paymentService =
                paymentService;
    }

    // =========================================================
    // CREATE PAYMENT
    // =========================================================

    @PostMapping
    public ResponseEntity<PaymentResponseDTO>
    taoPayment(
            @Valid
            @RequestBody TaoPaymentRequestDTO request,

            Authentication authentication,

            @RequestHeader("Authorization")
            String authorization
    ) {

        kiemTraCustomer(
                authentication
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        paymentService.taoPayment(
                                request,
                                layUserId(authentication),
                                authorization
                        )
                );
    }

    @PutMapping("/internal/bookings/{bookingId}/provider-confirm")
    public ResponseEntity<Void> providerConfirmInternal(
            @PathVariable Long bookingId,
            @RequestHeader(value = "X-Internal-Token", required = false) String token) {
        paymentService.providerConfirmTransfer(bookingId, token);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/internal/bookings/{bookingId}/provider-timeout")
    public ResponseEntity<Void> providerTimeoutInternal(
            @PathVariable Long bookingId,
            @RequestHeader(value = "X-Internal-Token", required = false) String token) {
        paymentService.providerConfirmationTimeout(bookingId, token);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/internal/bookings/{bookingId}/mock-refund")
    public ResponseEntity<Void> mockRefundInternal(
            @PathVariable Long bookingId,
            @RequestHeader(value = "X-Internal-Token", required = false) String token) {
        paymentService.mockRefundByBooking(bookingId, token);
        return ResponseEntity.ok().build();
    }

    // =========================================================
    // SEPAY WEBHOOK
    // =========================================================

    @PostMapping("/webhook")
    public ResponseEntity<WebhookResponseDTO>
    webhook(
            @Valid
            @RequestBody SePayWebhookDTO request,

            @RequestHeader(
                    value = "X-SePay-Secret",
                    required = false
            )
            String webhookSecret
    ) {

        return ResponseEntity.ok(
                paymentService.xuLyWebhook(
                        request,
                        webhookSecret
                )
        );
    }

    // =========================================================
    // PAYPAL
    // =========================================================

    @PostMapping("/payos/webhook")
    public ResponseEntity<Map<String, Object>> payosWebhook(@RequestBody JsonNode webhook) {
        return ResponseEntity.ok(paymentService.xuLyPayosWebhook(webhook));
    }

    @PostMapping("/paypal/orders/{orderId}/capture")
    public ResponseEntity<PaymentResponseDTO> capturePaypal(
            @PathVariable String orderId,
            Authentication authentication
    ) {
        kiemTraCustomer(authentication);

        return ResponseEntity.ok(
                paymentService.capturePaypalOrder(
                        orderId,
                        layUserId(authentication),
                        layRole(authentication)
                )
        );
    }

    @PostMapping("/paypal/webhook")
    public ResponseEntity<Map<String, Object>> paypalWebhook(
            @RequestBody String rawBody,
            @RequestHeader HttpHeaders headers
    ) {
        return ResponseEntity.ok(
                paymentService.xuLyPaypalWebhook(rawBody, headers)
        );
    }

    // =========================================================
    // READ
    // =========================================================

    @GetMapping("/me")
    public ResponseEntity<List<PaymentResponseDTO>>
    cuaToi(
            Authentication authentication
    ) {

        kiemTraCustomer(
                authentication
        );

        return ResponseEntity.ok(
                paymentService.thanhToanCuaToi(
                        layUserId(
                                authentication
                        )
                )
        );
    }

    /*
     * Endpoint dùng cho AI Service và frontend
     * tra Payment theo mã Booking.
     *
     * Vẫn kiểm tra quyền:
     * CUSTOMER chỉ xem Payment của chính mình.
     * ADMIN có thể xem tất cả.
     */
    @GetMapping("/booking/{bookingCode}")
    public ResponseEntity<PaymentResponseDTO>
    theoMaBooking(
            @PathVariable String bookingCode,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                paymentService.chiTietTheoMaBooking(
                        bookingCode,
                        layUserId(authentication),
                        layRole(authentication)
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponseDTO>
    chiTiet(
            @PathVariable Long id,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                paymentService.chiTiet(
                        id,
                        layUserId(authentication),
                        layRole(authentication)
                )
        );
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<PaymentResponseDTO>
    trangThai(
            @PathVariable Long id,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                paymentService.trangThai(
                        id,
                        layUserId(authentication),
                        layRole(authentication)
                )
        );
    }

    @GetMapping("/admin")
    public ResponseEntity<List<PaymentResponseDTO>> tatCaPaymentChoAdmin(Authentication authentication) {
        return ResponseEntity.ok(paymentService.tatCaPaymentChoAdmin(layRole(authentication)));
    }

    @GetMapping("/admin/refunds")
    public ResponseEntity<List<RefundResponseDTO>> tatCaHoanTienChoAdmin(Authentication authentication) {
        return ResponseEntity.ok(paymentService.tatCaHoanTienChoAdmin(layRole(authentication)));
    }

    // =========================================================
    // CANCEL PAYMENT
    // =========================================================

    @PostMapping("/{id}/cancel")
    public ResponseEntity<PaymentResponseDTO>
    huyPayment(
            @PathVariable Long id,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                paymentService.huyPayment(
                        id,
                        layUserId(authentication),
                        layRole(authentication)
                )
        );
    }

    @PutMapping("/{id}/reconcile-late-transfer")
    public ResponseEntity<PaymentResponseDTO> reconcileLateTransfer(
            @PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(paymentService.reconcileLateTransfer(id, layRole(authentication)));
    }

    // =========================================================
    // REFUND
    // =========================================================

    @PostMapping("/{id}/refund")
    public ResponseEntity<RefundResponseDTO>
    refund(
            @PathVariable Long id,

            @Valid
            @RequestBody RefundRequestDTO request,

            Authentication authentication
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        paymentService.yeuCauHoanTien(
                                id,
                                request,
                                layUserId(authentication),
                                layRole(authentication)
                        )
                );
    }

    @PutMapping("/refunds/{refundId}/confirm")
    public ResponseEntity<RefundResponseDTO>
    confirmRefund(
            @PathVariable Long refundId,

            @RequestParam String transactionCode,

            Authentication authentication
    ) {

        return ResponseEntity.ok(
                paymentService.xacNhanHoanTien(
                        refundId,
                        transactionCode,
                        layRole(authentication)
                )
        );
    }

    // =========================================================
    // AUTH HELPERS
    // =========================================================

    private Long layUserId(
            Authentication authentication
    ) {

        if (authentication == null
                || authentication.getDetails() == null) {

            throw new RuntimeException(
                    "Không xác định được người dùng"
            );
        }

        Object details =
                authentication.getDetails();

        if (details instanceof Number number) {

            return number.longValue();
        }

        throw new RuntimeException(
                "User ID trong token không hợp lệ"
        );
    }

    private String layRole(
            Authentication authentication
    ) {

        if (authentication == null
                || authentication
                .getAuthorities()
                .isEmpty()) {

            throw new RuntimeException(
                    "Không xác định được quyền người dùng"
            );
        }

        return authentication
                .getAuthorities()
                .iterator()
                .next()
                .getAuthority()
                .replace(
                        "ROLE_",
                        ""
                );
    }

    private void kiemTraCustomer(
            Authentication authentication
    ) {

        if (!"CUSTOMER".equals(
                layRole(authentication)
        )) {

            throw new RuntimeException(
                    "Chỉ CUSTOMER được thực hiện chức năng này"
            );
        }
    }
}
