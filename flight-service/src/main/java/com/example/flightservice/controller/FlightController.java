package com.example.flightservice.controller;

import com.example.flightservice.dto.*;
import com.example.flightservice.service.FlightService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flights")
public class FlightController {

    private final FlightService flightService;

    public FlightController(
            FlightService flightService
    ) {
        this.flightService =
                flightService;
    }

    @GetMapping("/catalog")
    public ResponseEntity<List<FlightResponseDTO>> danhSachCongKhaiChoKhachHang() {
        return ResponseEntity.ok(flightService.layDanhSachCongKhai());
    }

    @GetMapping("/internal/catalog")
    public ResponseEntity<List<FlightResponseDTO>> danhSachCongKhaiChoAi() {
        return ResponseEntity.ok(flightService.layDanhSachCongKhai());
    }

    @GetMapping("/search")
    public ResponseEntity<List<FlightResponseDTO>>
    timKiemChuyenBay(

            @RequestParam String diemDi,

            @RequestParam String diemDen,

            @RequestParam
            LocalDate ngayKhoiHanh
    ) {

        return ResponseEntity.ok(
                flightService.timKiem(
                        diemDi,
                        diemDen,
                        ngayKhoiHanh
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlightResponseDTO>
    layChiTiet(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                flightService.layChiTiet(id)
        );
    }

    @GetMapping
    public ResponseEntity<List<FlightResponseDTO>>
    layChuyenBayCuaToi(
            Authentication authentication
    ) {

        Long userId =
                layUserId(authentication);

        return ResponseEntity.ok(
                flightService
                        .layTheoNhaCungCap(
                                userId
                        )
        );
    }

    @PostMapping
    public ResponseEntity<FlightResponseDTO>
    taoChuyenBay(

            @Valid
            @RequestBody
            FlightRequestDTO request,

            Authentication authentication
    ) {

        kiemTraProviderHoacAdmin(
                authentication
        );

        Long userId =
                layUserId(authentication);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        flightService.taoChuyenBay(
                                request,
                                userId
                        )
                );
    }

    @PutMapping("/{id}")
    public ResponseEntity<FlightResponseDTO>
    capNhatChuyenBay(

            @PathVariable Long id,

            @Valid
            @RequestBody
            FlightRequestDTO request,

            Authentication authentication
    ) {

        Long userId =
                layUserId(authentication);

        String role =
                layRole(authentication);

        return ResponseEntity.ok(
                flightService.capNhatChuyenBay(
                        id,
                        request,
                        userId,
                        role
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    xoaChuyenBay(

            @PathVariable Long id,

            Authentication authentication
    ) {

        Long userId =
                layUserId(authentication);

        String role =
                layRole(authentication);

        flightService.xoaChuyenBay(
                id,
                userId,
                role
        );

        return ResponseEntity
                .noContent()
                .build();
    }

    @GetMapping("/{id}/inventory")
    public ResponseEntity<FlightInventoryDTO> laySoDoGhe(@PathVariable Long id, Authentication authentication) {
        Long userId = authentication == null ? null : layUserId(authentication);
        String role = authentication == null ? "PUBLIC" : layRole(authentication);
        return ResponseEntity.ok(flightService.laySoDoGhe(id, userId, role));
    }

    @PostMapping("/{id}/hold")
    public ResponseEntity<FlightHoldResponseDTO>
    giuGhe(

            @PathVariable Long id,

            @Valid
            @RequestBody
            FlightHoldRequestDTO request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        flightService.giuGhe(
                                id,
                                request
                        )
                );
    }

    @PutMapping("/holds/{bookingId}/confirm")
    public ResponseEntity<FlightHoldResponseDTO>
    xacNhanHold(
            @PathVariable Long bookingId
    ) {

        return ResponseEntity.ok(
                flightService
                        .xacNhanHold(
                                bookingId
                        )
        );
    }

    @PutMapping("/holds/{bookingId}/release")
    public ResponseEntity<FlightHoldResponseDTO>
    giaiPhongHold(
            @PathVariable Long bookingId
    ) {

        return ResponseEntity.ok(
                flightService
                        .giaiPhongHold(
                                bookingId
                        )
        );
    }


    // =========================================================
    // INTERNAL BOOKING -> INVENTORY
    // =========================================================

    @PutMapping("/internal/holds/{bookingId}/confirm")
    public ResponseEntity<FlightHoldResponseDTO> xacNhanHoldNoiBo(
            @PathVariable Long bookingId,
            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            ) String internalToken
    ) {

        return ResponseEntity.ok(
                flightService.xacNhanHoldNoiBo(
                        bookingId,
                        internalToken
                )
        );
    }

    @PutMapping("/internal/holds/{bookingId}/release")
    public ResponseEntity<FlightHoldResponseDTO> giaiPhongHoldNoiBo(
            @PathVariable Long bookingId,
            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            ) String internalToken
    ) {

        return ResponseEntity.ok(
                flightService.giaiPhongHoldNoiBo(
                        bookingId,
                        internalToken
                )
        );
    }

    @PutMapping("/internal/holds/{bookingId}/refund-release")
    public ResponseEntity<FlightHoldResponseDTO> releaseConfirmedForRefund(
            @PathVariable Long bookingId,
            @RequestHeader(value="X-Internal-Token",required=false) String token) {
        return ResponseEntity.ok(flightService.giaiPhongGheKhiHoanTien(bookingId, token));
    }

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
                "Không xác định được người dùng từ token"
        );
    }

    private String layRole(
            Authentication authentication
    ) {

        return authentication
                .getAuthorities()
                .stream()
                .findFirst()
                .map(authority ->
                        authority
                                .getAuthority()
                                .replace(
                                        "ROLE_",
                                        ""
                                )
                )
                .orElse("");
    }

    private void kiemTraProviderHoacAdmin(
            Authentication authentication
    ) {

        String role =
                layRole(authentication);

        if (!"PROVIDER".equals(role)
                && !"ADMIN".equals(role)) {

            throw new RuntimeException(
                    "Chỉ nhà cung cấp hoặc quản trị viên được phép tạo chuyến bay"
            );
        }
    }
}