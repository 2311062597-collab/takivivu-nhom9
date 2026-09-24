package com.example.authservice.controller;

import com.example.authservice.dto.*;
import com.example.authservice.entity.TrangThaiDuyet;
import com.example.authservice.entity.TrangThaiNguoiDung;
import com.example.authservice.service.AuthService;
import com.example.authservice.service.ProviderLicenseStorageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final ProviderLicenseStorageService providerLicenseStorageService;

    public AuthController(
            AuthService authService,
            ProviderLicenseStorageService providerLicenseStorageService
    ) {
        this.authService = authService;
        this.providerLicenseStorageService = providerLicenseStorageService;
    }

    // =========================================================
    // INTERNAL
    // =========================================================

    @GetMapping("/users/{userId}/exists")
    public ResponseEntity<Map<String, Object>>
    nguoiDungTonTai(
            @PathVariable Long userId,
            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            )
            String internalToken
    ) {

        boolean tonTai =
                authService.nguoiDungTonTai(
                        userId,
                        internalToken
                );

        return ResponseEntity.ok(
                Map.of(
                        "userId", userId,
                        "exists", tonTai
                )
        );
    }

    @GetMapping("/users/{userId}/contact")
    public ResponseEntity<InternalUserContactResponseDTO>
    layThongTinLienHeNoiBo(
            @PathVariable Long userId,
            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            )
            String internalToken
    ) {

        return ResponseEntity.ok(
                authService.layThongTinLienHeNoiBo(
                        userId,
                        internalToken
                )
        );
    }

    // =========================================================
    // REGISTER
    // =========================================================

    @PostMapping("/register/customer")
    public ResponseEntity<DangKyResponseDTO>
    dangKyKhachHang(
            @Valid
            @RequestBody
            DangKyKhachHangRequestDTO request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        authService
                                .dangKyKhachHang(
                                        request
                                )
                );
    }

    @PostMapping("/register/provider")
    public ResponseEntity<DangKyResponseDTO>
    dangKyNhaCungCap(
            @Valid
            @RequestBody
            DangKyNhaCungCapRequestDTO request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        authService
                                .dangKyNhaCungCap(
                                        request
                                )
                );
    }

    @PostMapping(
            value = "/provider-license/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadProviderLicense(
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(providerLicenseStorageService.save(file));
    }

    @GetMapping("/provider-licenses/{fileName:.+}")
    public ResponseEntity<Resource> viewProviderLicense(
            @PathVariable String fileName
    ) {
        Resource resource = providerLicenseStorageService.load(fileName);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .contentType(resolveImageMediaType(fileName))
                .body(resource);
    }

    private MediaType resolveImageMediaType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }

    // =========================================================
    // LOGIN / TOKEN
    // =========================================================

    @PostMapping("/login")
    public ResponseEntity<DangNhapResponseDTO>
    dangNhap(
            @Valid
            @RequestBody
            DangNhapRequestDTO request
    ) {

        return ResponseEntity.ok(
                authService.dangNhap(
                        request
                )
        );
    }

    @PostMapping("/refresh")
    public ResponseEntity<DangNhapResponseDTO>
    refreshToken(
            @Valid
            @RequestBody
            RefreshTokenRequestDTO request
    ) {

        return ResponseEntity.ok(
                authService.refreshToken(
                        request
                )
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>>
    dangXuat(
            @Valid
            @RequestBody
            LogoutRequestDTO request
    ) {

        authService.dangXuat(
                request
        );

        return ResponseEntity.ok(
                Map.of(
                        "thongBao",
                        "Đăng xuất thành công"
                )
        );
    }

    // =========================================================
    // PROFILE
    // =========================================================

    @GetMapping("/profile")
    public ResponseEntity<ThongTinCaNhanResponseDTO>
    layThongTinCaNhan(
            Principal principal
    ) {

        return ResponseEntity.ok(
                authService
                        .layThongTinCaNhan(
                                principal.getName()
                        )
        );
    }

    @PutMapping("/profile")
    public ResponseEntity<ThongTinCaNhanResponseDTO>
    capNhatThongTinCaNhan(
            @Valid
            @RequestBody
            CapNhatThongTinRequestDTO request,
            Principal principal
    ) {

        return ResponseEntity.ok(
                authService
                        .capNhatThongTinCaNhan(
                                principal.getName(),
                                request
                        )
        );
    }

    // =========================================================
    // ADMIN MANAGEMENT
    // =========================================================

    @GetMapping("/admin/users")
    public ResponseEntity<List<AdminUserResponseDTO>> layDanhSachNguoiDungAdmin(
            @RequestParam(required = false) com.example.authservice.entity.VaiTro role,
            @RequestParam(required = false) TrangThaiNguoiDung status,
            Principal principal
    ) {
        return ResponseEntity.ok(
                authService.layDanhSachNguoiDungAdmin(
                        principal.getName(),
                        role,
                        status
                )
        );
    }

    @PutMapping("/admin/users/{id}/status")
    public ResponseEntity<AdminUserResponseDTO> capNhatTrangThaiNguoiDungAdmin(
            @PathVariable Long id,
            @Valid @RequestBody CapNhatTrangThaiNguoiDungRequestDTO request,
            Principal principal
    ) {
        return ResponseEntity.ok(
                authService.capNhatTrangThaiNguoiDungAdmin(
                        id,
                        principal.getName(),
                        request
                )
        );
    }

    @GetMapping("/admin/dashboard")
    public ResponseEntity<AdminDashboardResponseDTO>
    layThongKeAdmin(
            Principal principal
    ) {

        return ResponseEntity.ok(
                authService.layThongKeAdmin(
                        principal.getName()
                )
        );
    }

    @GetMapping("/admin/providers")
    public ResponseEntity<List<NhaCungCapResponseDTO>>
    layDanhSachNhaCungCapAdmin(
            @RequestParam(required = false) TrangThaiDuyet status,
            Principal principal
    ) {

        return ResponseEntity.ok(
                authService.layDanhSachNhaCungCapAdmin(
                        principal.getName(),
                        status
                )
        );
    }

    @GetMapping("/admin/customers")
    public ResponseEntity<List<AdminUserResponseDTO>>
    layDanhSachKhachHangAdmin(
            @RequestParam(required = false) TrangThaiNguoiDung status,
            Principal principal
    ) {

        return ResponseEntity.ok(
                authService.layDanhSachKhachHangAdmin(
                        principal.getName(),
                        status
                )
        );
    }

    @PutMapping("/admin/customers/{id}/status")
    public ResponseEntity<AdminUserResponseDTO>
    capNhatTrangThaiKhachHangAdmin(
            @PathVariable Long id,
            @Valid @RequestBody CapNhatTrangThaiNguoiDungRequestDTO request,
            Principal principal
    ) {

        return ResponseEntity.ok(
                authService.capNhatTrangThaiKhachHangAdmin(
                        id,
                        principal.getName(),
                        request
                )
        );
    }

    // =========================================================
    // PROVIDER APPROVAL
    // =========================================================

    @GetMapping("/providers/pending")
    public ResponseEntity<List<NhaCungCapResponseDTO>>
    layDanhSachNhaCungCapChoDuyet() {

        return ResponseEntity.ok(
                authService
                        .layDanhSachNhaCungCapChoDuyet()
        );
    }

    @PutMapping("/providers/{id}/approve")
    public ResponseEntity<NhaCungCapResponseDTO>
    duyetNhaCungCap(
            @PathVariable Long id,
            Principal principal
    ) {

        return ResponseEntity.ok(
                authService
                        .duyetNhaCungCap(
                                id,
                                principal.getName()
                        )
        );
    }

    @PutMapping("/providers/{id}/reject")
    public ResponseEntity<NhaCungCapResponseDTO>
    tuChoiNhaCungCap(
            @PathVariable Long id,
            @RequestBody
            DuyetNhaCungCapRequestDTO request,
            Principal principal
    ) {

        return ResponseEntity.ok(
                authService
                        .tuChoiNhaCungCap(
                                id,
                                principal.getName(),
                                request
                        )
        );
    }
}