package com.example.attractionservice.controller;

import com.example.attractionservice.dto.*;
import com.example.attractionservice.service.AttractionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attractions")
public class AttractionController {

    private final AttractionService attractionService;
    private final com.example.attractionservice.service.AttractionImageStorageService attractionImageStorageService;

    public AttractionController(AttractionService attractionService, com.example.attractionservice.service.AttractionImageStorageService attractionImageStorageService) {
        this.attractionService = attractionService;
        this.attractionImageStorageService = attractionImageStorageService;
    }

    @PostMapping(value = "/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String,String>> uploadImage(@RequestParam("file") MultipartFile file, Authentication authentication) {
        if (authentication == null || authentication.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_PROVIDER") || a.getAuthority().equals("PROVIDER_TYPE_ATTRACTION"))) throw new RuntimeException("Chỉ nhà cung cấp địa điểm tham quan được tải ảnh");
        return ResponseEntity.ok(attractionImageStorageService.save(file));
    }

    @GetMapping("/images/{fileName:.+}")
    public ResponseEntity<Resource> viewImage(@PathVariable String fileName) {
        Resource r=attractionImageStorageService.load(fileName);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\""+r.getFilename()+"\"").body(r);
    }

    // =========================================================
    // PUBLIC
    // =========================================================

    @GetMapping("/catalog")
    public ResponseEntity<List<DiaDiemResponseDTO>> danhSachCongKhaiChoKhachHang() {
        return ResponseEntity.ok(attractionService.layDanhSachCongKhai());
    }

    @GetMapping("/internal/catalog")
    public ResponseEntity<List<DiaDiemResponseDTO>> danhSachCongKhaiChoAi() {
        return ResponseEntity.ok(attractionService.layDanhSachCongKhai());
    }

    @GetMapping("/search")
    public ResponseEntity<List<DiaDiemResponseDTO>> timKiem(
            @RequestParam String thanhPho,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate ngaySuDung,

            @RequestParam Integer soLuongVe
    ) {

        return ResponseEntity.ok(
                attractionService.timKiemDiaDiem(
                        thanhPho,
                        ngaySuDung,
                        soLuongVe
                )
        );
    }

    @GetMapping("/ticket-categories")
    public ResponseEntity<List<LoaiVeDanhMucDTO>> danhMucLoaiVe() {
        return ResponseEntity.ok(attractionService.layDanhMucLoaiVe());
    }

    /*
     * Integration cho Booking Service.
     *
     * GET /api/attractions/tickets/{loaiVeId}
     */
    @GetMapping("/tickets/{loaiVeId}")
    public ResponseEntity<LoaiVeResponseDTO>
    layChiTietLoaiVe(
            @PathVariable Long loaiVeId
    ) {

        return ResponseEntity.ok(
                attractionService
                        .layChiTietLoaiVe(
                                loaiVeId
                        )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiaDiemResponseDTO> chiTiet(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                attractionService
                        .layChiTietDiaDiem(id)
        );
    }

    // =========================================================
    // PROVIDER
    // =========================================================

    @GetMapping
    public ResponseEntity<List<DiaDiemResponseDTO>>
    danhSachCuaProvider(
            Authentication authentication
    ) {

        kiemTraProviderHoacAdmin(
                authentication
        );

        Long userId =
                layUserId(authentication);

        return ResponseEntity.ok(
                attractionService
                        .layDiaDiemCuaNhaCungCap(
                                userId
                        )
        );
    }

    @PostMapping
    public ResponseEntity<DiaDiemResponseDTO> tao(
            @Valid
            @RequestBody DiaDiemRequestDTO request,
            Authentication authentication
    ) {

        kiemTraProvider(
                authentication
        );

        Long userId =
                layUserId(authentication);

        return ResponseEntity
                .status(
                        HttpStatus.CREATED
                )
                .body(
                        attractionService.taoDiaDiem(
                                request,
                                userId
                        )
                );
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiaDiemResponseDTO> capNhat(
            @PathVariable Long id,

            @Valid
            @RequestBody DiaDiemRequestDTO request,

            Authentication authentication
    ) {

        Long userId =
                layUserId(authentication);

        String role =
                layRole(authentication);

        return ResponseEntity.ok(
                attractionService.capNhatDiaDiem(
                        id,
                        request,
                        userId,
                        role
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> xoa(
            @PathVariable Long id,
            Authentication authentication
    ) {

        Long userId =
                layUserId(authentication);

        String role =
                layRole(authentication);

        attractionService.xoaDiaDiem(
                id,
                userId,
                role
        );

        return ResponseEntity
                .noContent()
                .build();
    }

    // =========================================================
    // LOẠI VÉ
    // =========================================================

    @PostMapping("/{diaDiemId}/tickets")
    public ResponseEntity<LoaiVeResponseDTO> themLoaiVe(
            @PathVariable Long diaDiemId,

            @Valid
            @RequestBody LoaiVeRequestDTO request,

            Authentication authentication
    ) {

        Long userId =
                layUserId(authentication);

        String role =
                layRole(authentication);

        return ResponseEntity
                .status(
                        HttpStatus.CREATED
                )
                .body(
                        attractionService.themLoaiVe(
                                diaDiemId,
                                request,
                                userId,
                                role
                        )
                );
    }

    @PutMapping("/{diaDiemId}/tickets/{loaiVeId}")
    public ResponseEntity<LoaiVeResponseDTO> capNhatLoaiVe(
            @PathVariable Long diaDiemId,
            @PathVariable Long loaiVeId,

            @Valid
            @RequestBody LoaiVeRequestDTO request,

            Authentication authentication
    ) {

        Long userId =
                layUserId(authentication);

        String role =
                layRole(authentication);

        return ResponseEntity.ok(
                attractionService.capNhatLoaiVe(
                        diaDiemId,
                        loaiVeId,
                        request,
                        userId,
                        role
                )
        );
    }

    @DeleteMapping("/{diaDiemId}/tickets/{loaiVeId}")
    public ResponseEntity<Void> xoaLoaiVe(
            @PathVariable Long diaDiemId,
            @PathVariable Long loaiVeId,
            Authentication authentication
    ) {

        Long userId =
                layUserId(authentication);

        String role =
                layRole(authentication);

        attractionService.xoaLoaiVe(
                diaDiemId,
                loaiVeId,
                userId,
                role
        );

        return ResponseEntity
                .noContent()
                .build();
    }

    // =========================================================
    // HOLD
    // =========================================================

    @PostMapping("/tickets/{loaiVeId}/hold")
    public ResponseEntity<GiuVeResponseDTO> giuVe(
            @PathVariable Long loaiVeId,

            @Valid
            @RequestBody GiuVeRequestDTO request
    ) {

        return ResponseEntity
                .status(
                        HttpStatus.CREATED
                )
                .body(
                        attractionService.giuVe(
                                loaiVeId,
                                request
                        )
                );
    }

    @PutMapping("/holds/{bookingId}/confirm")
    public ResponseEntity<GiuVeResponseDTO> xacNhanHold(
            @PathVariable Long bookingId
    ) {

        return ResponseEntity.ok(
                attractionService
                        .xacNhanHold(
                                bookingId
                        )
        );
    }

    @PutMapping("/holds/{bookingId}/release")
    public ResponseEntity<GiuVeResponseDTO> releaseHold(
            @PathVariable Long bookingId
    ) {

        return ResponseEntity.ok(
                attractionService
                        .giaiPhongHold(
                                bookingId
                        )
        );
    }



    // =========================================================
    // INTERNAL BOOKING -> INVENTORY
    // =========================================================

    @PutMapping("/internal/holds/{bookingId}/confirm")
    public ResponseEntity<GiuVeResponseDTO> xacNhanHoldNoiBo(
            @PathVariable Long bookingId,
            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            ) String internalToken
    ) {

        return ResponseEntity.ok(
                attractionService.xacNhanHoldNoiBo(
                        bookingId,
                        internalToken
                )
        );
    }

    @PutMapping("/internal/holds/{bookingId}/release")
    public ResponseEntity<GiuVeResponseDTO> giaiPhongHoldNoiBo(
            @PathVariable Long bookingId,
            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            ) String internalToken
    ) {

        return ResponseEntity.ok(
                attractionService.giaiPhongHoldNoiBo(
                        bookingId,
                        internalToken
                )
        );
    }

    @PutMapping("/internal/holds/{bookingId}/refund-release")
    public ResponseEntity<GiuVeResponseDTO> refundRelease(
            @PathVariable Long bookingId,
            @RequestHeader(value = "X-Internal-Token", required = false) String token
    ) {
        return ResponseEntity.ok(attractionService.giaiPhongKhiHoanTien(bookingId, token));
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
                "Không xác định được người dùng từ token"
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

    private void kiemTraProvider(
            Authentication authentication
    ) {

        String role =
                layRole(authentication);

        if (!"PROVIDER".equals(role)) {

            throw new RuntimeException(
                    "Chỉ PROVIDER mới được thực hiện chức năng này"
            );
        }
    }

    private void kiemTraProviderHoacAdmin(
            Authentication authentication
    ) {

        String role =
                layRole(authentication);

        if (!"PROVIDER".equals(role)
                && !"ADMIN".equals(role)) {

            throw new RuntimeException(
                    "Bạn không có quyền thực hiện chức năng này"
            );
        }
    }
}