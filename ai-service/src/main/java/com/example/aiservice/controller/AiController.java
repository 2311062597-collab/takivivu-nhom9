package com.example.aiservice.controller;

import com.example.aiservice.dto.*;
import com.example.aiservice.service.AiService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(
            AiService aiService
    ) {
        this.aiService = aiService;
    }

    // =========================================================
    // POST /api/ai/chat
    // =========================================================

    @PostMapping("/chat")
    public ResponseEntity<AiResponseDTO>
    chat(
            @Valid
            @RequestBody AiRequestDTO request
    ) {

        return ResponseEntity.ok(
                aiService.chat(
                        request.getMessage()
                )
        );
    }

    // =========================================================
    // POST /api/ai/recommend
    // =========================================================

    @PostMapping("/recommend")
    public ResponseEntity<AiResponseDTO>
    recommend(
            @Valid
            @RequestBody AiRequestDTO request
    ) {

        return ResponseEntity.ok(
                aiService.recommend(
                        request.getMessage()
                )
        );
    }

    // =========================================================
    // POST /api/ai/booking-help
    // =========================================================

    @PostMapping("/booking-help")
    public ResponseEntity<AiResponseDTO>
    bookingHelp(
            @Valid
            @RequestBody BookingHelpRequestDTO request,

            @RequestHeader(
                    value = HttpHeaders.AUTHORIZATION,
                    required = false
            )
            String authorization
    ) {

        return ResponseEntity.ok(
                aiService.bookingHelp(
                        request.getMessage(),
                        request.getBookingCode(),
                        authorization
                )
        );
    }

    // =========================================================
    // POST /api/ai/payment-help
    // CUSTOMER phải đăng nhập
    // =========================================================

    @PostMapping("/payment-help")
    public ResponseEntity<AiResponseDTO>
    paymentHelp(
            @Valid
            @RequestBody PaymentHelpRequestDTO request,

            @RequestHeader(
                    HttpHeaders.AUTHORIZATION
            )
            String authorization
    ) {

        return ResponseEntity.ok(
                aiService.paymentHelp(
                        request.getBookingCode(),
                        authorization
                )
        );
    }

    // =========================================================
    // Hỗ trợ mục 14.6 của SRS.
    // AI chỉ kiểm tra/hướng dẫn, KHÔNG hủy.
    // =========================================================

    @PostMapping("/cancel-help")
    public ResponseEntity<AiResponseDTO>
    cancelHelp(
            @Valid
            @RequestBody PaymentHelpRequestDTO request,

            @RequestHeader(
                    HttpHeaders.AUTHORIZATION
            )
            String authorization
    ) {

        return ResponseEntity.ok(
                aiService.cancelHelp(
                        request.getBookingCode(),
                        authorization
                )
        );
    }
}