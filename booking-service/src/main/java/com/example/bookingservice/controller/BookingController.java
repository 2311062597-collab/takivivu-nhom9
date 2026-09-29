package com.example.bookingservice.controller;

import com.example.bookingservice.dto.BookingRequestDTO;
import com.example.bookingservice.dto.BookingResponseDTO;
import com.example.bookingservice.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(
            BookingService bookingService
    ) {
        this.bookingService = bookingService;
    }

    // =========================================================
    // CREATE
    // =========================================================

    @PostMapping
    public ResponseEntity<BookingResponseDTO> taoBooking(
            @Valid
            @RequestBody BookingRequestDTO request,

            Authentication authentication,

            @RequestHeader("Authorization")
            String authorization
    ) {

        kiemTraCustomer(authentication);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        bookingService.taoBooking(
                                request,
                                layUserId(authentication),
                                authorization
                        )
                );
    }

    @PostMapping("/{id}/cancel-request")
    public ResponseEntity<BookingResponseDTO> requestCancellation(@PathVariable Long id,
            @RequestBody java.util.Map<String, String> body, Authentication authentication) {
        kiemTraCustomer(authentication);
        return ResponseEntity.ok(bookingService.yeuCauHuyHoanTien(id,
                layUserId(authentication), body.get("lyDo")));
    }

    @PutMapping("/{id}/provider-resolve-cancellation")
    public ResponseEntity<BookingResponseDTO> resolveCancellation(@PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body, Authentication authentication) {
        kiemTraProvider(authentication);
        return ResponseEntity.ok(bookingService.providerResolveCancellation(id,
                layUserId(authentication), Boolean.TRUE.equals(body.get("approved")),
                (String) body.get("lyDoTuChoi")));
    }

    // =========================================================
    // READ
    // =========================================================

    @GetMapping("/me")
    public ResponseEntity<List<BookingResponseDTO>>
    bookingCuaToi(
            Authentication authentication
    ) {

        kiemTraCustomer(authentication);

        return ResponseEntity.ok(
                bookingService.bookingCuaKhachHang(
                        layUserId(authentication)
                )
        );
    }

    @GetMapping("/provider/me")
    public ResponseEntity<List<BookingResponseDTO>> bookingCuaNhaCungCap(Authentication authentication) {
        kiemTraProvider(authentication);
        return ResponseEntity.ok(bookingService.bookingCuaNhaCungCap(layUserId(authentication)));
    }

    @GetMapping("/code/{bookingCode}")
    public ResponseEntity<BookingResponseDTO>
    chiTietTheoMaBooking(
            @PathVariable String bookingCode,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                bookingService.chiTietTheoMaBooking(
                        bookingCode,
                        layUserId(authentication),
                        layRole(authentication)
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> chiTiet(
            @PathVariable Long id,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                bookingService.chiTiet(
                        id,
                        layUserId(authentication),
                        layRole(authentication)
                )
        );
    }

    // =========================================================
    // CANCEL
    // =========================================================

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponseDTO> huy(
            @PathVariable Long id,

            Authentication authentication,

            @RequestHeader("Authorization")
            String authorization
    ) {

        kiemTraCustomer(authentication);

        return ResponseEntity.ok(
                bookingService.huyBooking(
                        id,
                        layUserId(authentication),
                        authorization
                )
        );
    }

    @PutMapping("/{id}/confirm-bank-transfer")
    public ResponseEntity<BookingResponseDTO> customerConfirmBankTransfer(@PathVariable Long id, Authentication authentication) {
        kiemTraCustomer(authentication);
        return ResponseEntity.ok(bookingService.customerConfirmBankTransfer(id, layUserId(authentication)));
    }

    @PutMapping("/{id}/provider-confirm-payment")
    public ResponseEntity<BookingResponseDTO> providerConfirmPayment(@PathVariable Long id, Authentication authentication) {
        kiemTraProvider(authentication);
        return ResponseEntity.ok(bookingService.providerConfirmBankTransfer(id, layUserId(authentication)));
    }

    @PutMapping("/{id}/provider-reconcile-payment")
    public ResponseEntity<BookingResponseDTO> providerReconcilePayment(@PathVariable Long id, Authentication authentication) {
        kiemTraProvider(authentication);
        return ResponseEntity.ok(bookingService.reconcileConfirmedBankTransfer(id, layUserId(authentication)));
    }

    // =========================================================
    // INTERNAL PAYMENT -> BOOKING
    // =========================================================

    @GetMapping("/internal/{id}/payment-state")
    public ResponseEntity<java.util.Map<String, String>> internalPaymentState(
            @PathVariable Long id,
            @RequestHeader(value = "X-Internal-Token", required = false) String token) {
        return ResponseEntity.ok(bookingService.internalPaymentState(id, token));
    }

    @PutMapping("/internal/{id}/prepare-payment")
    public ResponseEntity<BookingResponseDTO> internalPreparePayment(
            @PathVariable Long id,
            @RequestHeader(value = "X-Internal-Token", required = false) String internalToken
    ) {
        return ResponseEntity.ok(bookingService.chuanBiThanhToan(id, internalToken));
    }

    @PutMapping(
            "/internal/{id}/payment-received"
    )
    public ResponseEntity<BookingResponseDTO>
    internalPaymentReceived(
            @PathVariable Long id,

            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            )
            String internalToken
    ) {

        return ResponseEntity.ok(
                bookingService.internalPaymentReceived(
                        id,
                        internalToken
                )
        );
    }

    @PutMapping(
            "/internal/{id}/payment-success"
    )
    public ResponseEntity<BookingResponseDTO>
    internalPaymentSuccess(
            @PathVariable Long id,

            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            )
            String internalToken
    ) {

        return ResponseEntity.ok(
                bookingService.internalPaymentSuccess(
                        id,
                        internalToken
                )
        );
    }

    @PutMapping(
            "/internal/{id}/payment-failed"
    )
    public ResponseEntity<BookingResponseDTO>
    internalPaymentFailed(
            @PathVariable Long id,

            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            )
            String internalToken
    ) {

        return ResponseEntity.ok(
                bookingService.internalPaymentFailed(
                        id,
                        internalToken
                )
        );
    }

    @PutMapping("/internal/{id}/refund-pending")
    public ResponseEntity<BookingResponseDTO> internalRefundPending(
            @PathVariable Long id,
            @RequestHeader(value = "X-Internal-Token", required = false) String internalToken
    ) {
        return ResponseEntity.ok(bookingService.internalRefundPending(id, internalToken));
    }

    @PutMapping("/internal/{id}/refunded")
    public ResponseEntity<BookingResponseDTO> internalRefunded(
            @PathVariable Long id,
            @RequestHeader(value = "X-Internal-Token", required = false) String internalToken
    ) {
        return ResponseEntity.ok(bookingService.internalRefunded(id, internalToken));
    }

    // =========================================================
    // ADMIN SUPPORT
    // =========================================================

    @GetMapping("/admin")
    public ResponseEntity<List<BookingResponseDTO>> tatCaBookingChoAdmin(Authentication authentication) {
        kiemTraAdmin(authentication);
        return ResponseEntity.ok(bookingService.tatCaBookingChoAdmin());
    }

    @PutMapping("/{id}/expire")
    public ResponseEntity<BookingResponseDTO> expire(
            @PathVariable Long id,

            Authentication authentication,

            @RequestHeader("Authorization")
            String authorization
    ) {

        kiemTraAdmin(authentication);

        return ResponseEntity.ok(
                bookingService.hetHan(
                        id,
                        authorization
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

    private void kiemTraProvider(Authentication authentication) {
        if (!"PROVIDER".equals(layRole(authentication))) {
            throw new RuntimeException("Chỉ PROVIDER được thực hiện chức năng này");
        }
    }

    private void kiemTraAdmin(
            Authentication authentication
    ) {

        if (!"ADMIN".equals(
                layRole(authentication)
        )) {

            throw new RuntimeException(
                    "Chỉ ADMIN được thực hiện chức năng này"
            );
        }
    }
}