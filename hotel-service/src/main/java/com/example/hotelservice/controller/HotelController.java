package com.example.hotelservice.controller;

import com.example.hotelservice.dto.*;
import com.example.hotelservice.service.HotelService;
import com.example.hotelservice.service.HotelImageStorageService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    private final HotelService hotelService;
    private final com.example.hotelservice.service.PhysicalBookingService physicalBooking;
    private final HotelImageStorageService hotelImageStorageService;

    public HotelController(
            HotelService hotelService,
            HotelImageStorageService hotelImageStorageService, com.example.hotelservice.service.PhysicalBookingService physicalBooking
    ) {
        this.hotelService = hotelService;this.physicalBooking=physicalBooking;
        this.hotelImageStorageService = hotelImageStorageService;
    }


    @PostMapping(
            value = "/images/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadHotelImage(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        kiemTraProvider(authentication);
        return ResponseEntity.ok(hotelImageStorageService.save(file));
    }

    @GetMapping("/images/{fileName:.+}")
    public ResponseEntity<Resource> viewHotelImage(
            @PathVariable String fileName
    ) {
        Resource resource = hotelImageStorageService.load(fileName);
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

    @GetMapping("/catalog")
    public ResponseEntity<List<KhachSanResponseDTO>> danhSachCongKhaiChoKhachHang() {
        return ResponseEntity.ok(hotelService.layDanhSachCongKhai());
    }

    @GetMapping("/internal/catalog")
    public ResponseEntity<List<KhachSanResponseDTO>> danhSachCongKhaiChoAi() {
        return ResponseEntity.ok(hotelService.layDanhSachCongKhai());
    }

    @GetMapping("/search")
    public ResponseEntity<List<KhachSanResponseDTO>>
    timKiemKhachSan(
            @RequestParam String thanhPho,
            @RequestParam LocalDate ngayNhanPhong,
            @RequestParam LocalDate ngayTraPhong,
            @RequestParam Integer soKhach,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice
    ) {

        return ResponseEntity.ok(
                hotelService.timKiemKhachSan(
                        thanhPho,
                        ngayNhanPhong,
                        ngayTraPhong,
                        soKhach,
                        minPrice,
                        maxPrice
                )
        );
    }

    /*
     * Integration cho Booking Service.
     *
     * GET /api/hotels/rooms/{phongId}
     */
    @GetMapping("/rooms/{phongId}")
    public ResponseEntity<PhongResponseDTO>
    layChiTietPhong(
            @PathVariable Long phongId, @RequestParam(required=false) Long phongCuTheId
    ) {

        return ResponseEntity.ok(
                hotelService.layChiTietPhong(
                        phongId, phongCuTheId
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<KhachSanResponseDTO>
    layChiTiet(
            @PathVariable Long id, @RequestParam(required=false) LocalDate checkIn, @RequestParam(required=false) LocalDate checkOut, @RequestParam(required=false) Integer guests
    ) {
        if((checkIn==null)!=(checkOut==null))throw new IllegalArgumentException("Cần cả ngày nhận và trả phòng");
        return ResponseEntity.ok(
                checkIn!=null?hotelService.layChiTietKhachSanTheoNgay(id,checkIn,checkOut,guests):hotelService.layChiTietKhachSan(id)
        );
    }

    @GetMapping
    public ResponseEntity<List<KhachSanResponseDTO>>
    layKhachSanCuaToi(
            Authentication authentication
    ) {

        kiemTraProviderHoacAdmin(authentication);

        Long userId =
                layUserId(authentication);

        return ResponseEntity.ok(
                hotelService
                        .layKhachSanCuaNhaCungCap(
                                userId
                        )
        );
    }

    @PostMapping
    public ResponseEntity<KhachSanResponseDTO>
    taoKhachSan(
            @Valid
            @RequestBody KhachSanRequestDTO request,
            Authentication authentication
    ) {

        kiemTraProvider(authentication);

        Long userId =
                layUserId(authentication);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        hotelService.taoKhachSan(
                                request,
                                userId
                        )
                );
    }

    @PutMapping("/{id}")
    public ResponseEntity<KhachSanResponseDTO>
    capNhatKhachSan(
            @PathVariable Long id,
            @Valid
            @RequestBody KhachSanRequestDTO request,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                hotelService.capNhatKhachSan(
                        id,
                        request,
                        layUserId(authentication),
                        layRole(authentication)
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    xoaKhachSan(
            @PathVariable Long id,
            Authentication authentication
    ) {

        hotelService.xoaKhachSan(
                id,
                layUserId(authentication),
                layRole(authentication)
        );

        return ResponseEntity
                .noContent()
                .build();
    }

    @PostMapping("/{khachSanId}/rooms")
    public ResponseEntity<PhongResponseDTO>
    themPhong(
            @PathVariable Long khachSanId,
            @Valid
            @RequestBody PhongRequestDTO request,
            Authentication authentication
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        hotelService.themPhong(
                                khachSanId,
                                request,
                                layUserId(authentication),
                                layRole(authentication)
                        )
                );
    }

    @PutMapping("/{khachSanId}/rooms/{phongId}")
    public ResponseEntity<PhongResponseDTO>
    capNhatPhong(
            @PathVariable Long khachSanId,
            @PathVariable Long phongId,
            @Valid
            @RequestBody PhongRequestDTO request,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                hotelService.capNhatPhong(
                        khachSanId,
                        phongId,
                        request,
                        layUserId(authentication),
                        layRole(authentication)
                )
        );
    }

    @DeleteMapping("/{khachSanId}/rooms/{phongId}")
    public ResponseEntity<Void>
    xoaPhong(
            @PathVariable Long khachSanId,
            @PathVariable Long phongId,
            Authentication authentication
    ) {

        hotelService.xoaPhong(
                khachSanId,
                phongId,
                layUserId(authentication),
                layRole(authentication)
        );

        return ResponseEntity
                .noContent()
                .build();
    }

    @PostMapping("/rooms/{phongId}/hold")
    public ResponseEntity<GiuPhongResponseDTO>
    giuPhong(
            @PathVariable Long phongId,
            @Valid
            @RequestBody GiuPhongRequestDTO request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        physicalBooking.hold(phongId, request)
                );
    }

    @PutMapping("/holds/{bookingId}/confirm")
    public ResponseEntity<GiuPhongResponseDTO>
    xacNhanHold(
            @PathVariable Long bookingId
    ) {

        return ResponseEntity.ok(
                physicalBooking.confirm(bookingId)
        );
    }

    @PutMapping("/holds/{bookingId}/release")
    public ResponseEntity<GiuPhongResponseDTO>
    giaiPhongHold(
            @PathVariable Long bookingId
    ) {

        return ResponseEntity.ok(
                physicalBooking.release(bookingId)
        );
    }


    // =========================================================
    // INTERNAL BOOKING -> INVENTORY
    // =========================================================

    @PutMapping("/internal/holds/{bookingId}/confirm")
    public ResponseEntity<GiuPhongResponseDTO> xacNhanHoldNoiBo(
            @PathVariable Long bookingId,
            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            ) String internalToken
    ) {

        return ResponseEntity.ok(
                hotelService.xacNhanHoldNoiBo(
                        bookingId,
                        internalToken
                )
        );
    }

    @PutMapping("/internal/holds/{bookingId}/release")
    public ResponseEntity<GiuPhongResponseDTO> giaiPhongHoldNoiBo(
            @PathVariable Long bookingId,
            @RequestHeader(
                    value = "X-Internal-Token",
                    required = false
            ) String internalToken
    ) {

        return ResponseEntity.ok(
                hotelService.giaiPhongHoldNoiBo(
                        bookingId,
                        internalToken
                )
        );
    }

    @PutMapping("/internal/holds/{bookingId}/refund-release")
    public ResponseEntity<GiuPhongResponseDTO> giaiPhongPhongCuTheKhiHoanTien(
            @PathVariable Long bookingId,
            @RequestHeader(value = "X-Internal-Token", required = false) String internalToken) {
        return ResponseEntity.ok(hotelService.giaiPhongPhongCuTheKhiHoanTien(bookingId, internalToken));
    }

    private Long layUserId(
            Authentication authentication
    ) {

        if (authentication == null) {
            throw new RuntimeException(
                    "Người dùng chưa đăng nhập"
            );
        }

        Object details =
                authentication.getDetails();

        if (!(details instanceof Long)) {
            throw new RuntimeException(
                    "Không xác định được người dùng từ token"
            );
        }

        return (Long) details;
    }

    private String layRole(
            Authentication authentication
    ) {

        if (authentication == null) {
            return "";
        }

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

    private void kiemTraProvider(
            Authentication authentication
    ) {

        String role =
                layRole(authentication);

        if (!"PROVIDER".equals(role)) {
            throw new RuntimeException(
                    "Chỉ nhà cung cấp được thực hiện chức năng này"
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