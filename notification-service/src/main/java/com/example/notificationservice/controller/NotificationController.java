package com.example.notificationservice.controller;

import com.example.notificationservice.dto.NotificationResponseDTO;
import com.example.notificationservice.dto.TaoNotificationRequestDTO;
import com.example.notificationservice.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService
    ) {
        this.notificationService =
                notificationService;
    }

    // =========================================================
    // INTERNAL CREATE
    // Auth / Booking / Payment gọi endpoint này.
    // =========================================================

    @PostMapping("/internal")
    public ResponseEntity<NotificationResponseDTO>
    taoThongBaoInternal(
            @Valid
            @RequestBody TaoNotificationRequestDTO request,

            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            )
            String internalToken
    ) {

        NotificationResponseDTO response =
                notificationService.taoThongBao(
                        request,
                        internalToken
                );

        return ResponseEntity
                .status(
                        HttpStatus.CREATED
                )
                .body(response);
    }

    // =========================================================
    // POST /api/notifications
    //
    // Giữ API theo SRS.
    // Việc tạo thông báo vẫn yêu cầu internal token
    // để user không tự giả mạo sự kiện.
    // =========================================================

    @PostMapping
    public ResponseEntity<NotificationResponseDTO>
    taoThongBao(
            @Valid
            @RequestBody TaoNotificationRequestDTO request,

            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            )
            String internalToken
    ) {

        NotificationResponseDTO response =
                notificationService.taoThongBao(
                        request,
                        internalToken
                );

        return ResponseEntity
                .status(
                        HttpStatus.CREATED
                )
                .body(response);
    }

    // =========================================================
    // GET /api/notifications
    // =========================================================

    @GetMapping
    public ResponseEntity<List<NotificationResponseDTO>>
    layThongBaoCuaToi(
            Authentication authentication
    ) {

        Long currentUserId =
                layUserId(
                        authentication
                );

        return ResponseEntity.ok(
                notificationService
                        .layThongBaoCuaToi(
                                currentUserId
                        )
        );
    }

    // =========================================================
    // PUT /api/notifications/{id}/read
    // =========================================================

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponseDTO>
    danhDauDaDoc(
            @PathVariable Long id,
            Authentication authentication
    ) {

        Long currentUserId =
                layUserId(
                        authentication
                );

        return ResponseEntity.ok(
                notificationService
                        .danhDauDaDoc(
                                id,
                                currentUserId
                        )
        );
    }

    // =========================================================
    // CURRENT USER ID
    // =========================================================

    private Long layUserId(
            Authentication authentication
    ) {

        if (authentication == null
                || authentication.getDetails() == null) {

            throw new SecurityException(
                    "Bạn chưa đăng nhập."
            );
        }

        Object details =
                authentication.getDetails();

        if (details instanceof Number number) {

            return number.longValue();
        }

        throw new SecurityException(
                "Không xác định được người dùng."
        );
    }
}