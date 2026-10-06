package com.example.promotionservice.controller;

import com.example.promotionservice.dto.*;
import com.example.promotionservice.entity.ServiceType;
import com.example.promotionservice.service.PromotionService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {
    private final PromotionService service;
    public PromotionController(PromotionService service) { this.service = service; }

    @GetMapping("/available")
    public List<PromotionResponseDTO> available(
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) Long serviceId,
            @RequestParam(required = false) Long providerId) {
        return service.listAvailable(serviceType, serviceId, providerId);
    }

    @GetMapping("/public/{id}")
    public PromotionResponseDTO publicDetail(@PathVariable Long id) {
        return service.publicDetail(id);
    }

    @GetMapping("/generate-code")
    public Map<String, String> generateCode() {
        // Chỉ sinh một mã ngẫu nhiên chưa tồn tại; không trả dữ liệu riêng tư.
        // Cho phép form lấy mã ngay cả khi JWT ở frontend chưa kịp gắn vào request.
        return Map.of("code", service.generateUniqueCode());
    }

    @GetMapping
    public List<PromotionResponseDTO> mine(Authentication authentication) {
        requireProviderOrAdmin(authentication);
        return service.listMine(userId(authentication), role(authentication));
    }

    @GetMapping("/{id}")
    public PromotionResponseDTO detail(@PathVariable Long id, Authentication authentication) {
        requireProviderOrAdmin(authentication);
        return service.detail(id, userId(authentication), role(authentication));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PromotionResponseDTO create(
            @Valid @RequestBody PromotionRequestDTO request,
            Authentication authentication,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireProviderOrAdmin(authentication);
        return service.create(request, userId(authentication), role(authentication), providerType(authentication), authorization);
    }

    @PutMapping("/{id}")
    public PromotionResponseDTO update(
            @PathVariable Long id,
            @Valid @RequestBody PromotionRequestDTO request,
            Authentication authentication,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        requireProviderOrAdmin(authentication);
        return service.update(id, request, userId(authentication), role(authentication), providerType(authentication), authorization);
    }

    @PutMapping("/{id}/deactivate")
    public PromotionResponseDTO deactivate(@PathVariable Long id, Authentication authentication) {
        requireProviderOrAdmin(authentication);
        return service.deactivate(id, userId(authentication), role(authentication));
    }

    @DeleteMapping("/{id}")
    public Map<String,Object> delete(@PathVariable Long id, Authentication authentication) {
        requireProviderOrAdmin(authentication);
        return service.deleteOrDeactivate(id, userId(authentication), role(authentication));
    }

    @PostMapping("/internal/reserve")
    public PromotionCheckResponseDTO reserve(
            @Valid @RequestBody PromotionCheckRequestDTO request,
            @RequestHeader(value = "X-Internal-Token", required = false) String token) {
        return service.reserve(request, token);
    }

    @PostMapping("/internal/revalidate")
    public PromotionCheckResponseDTO revalidate(
            @Valid @RequestBody PromotionCheckRequestDTO request,
            @RequestHeader(value = "X-Internal-Token", required = false) String token) {
        return service.revalidate(request, token);
    }

    @PostMapping("/internal/bookings/{bookingId}/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirm(@PathVariable Long bookingId,
                        @RequestHeader(value = "X-Internal-Token", required = false) String token) {
        service.confirm(bookingId, token);
    }

    @PostMapping("/internal/bookings/{bookingId}/release")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void release(@PathVariable Long bookingId,
                        @RequestHeader(value = "X-Internal-Token", required = false) String token) {
        service.release(bookingId, token);
    }


    @GetMapping("/saved")
    public List<PromotionResponseDTO> saved(Authentication authentication) {
        return service.listSavedForCustomer(userId(authentication));
    }

    @PostMapping("/{id}/save")
    public PromotionResponseDTO save(@PathVariable Long id, Authentication authentication) {
        return service.saveForCustomer(id, userId(authentication));
    }

    @DeleteMapping("/{id}/save")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeSaved(@PathVariable Long id, Authentication authentication) {
        service.removeSavedForCustomer(id, userId(authentication));
    }

    private Long userId(Authentication authentication) {
        if (authentication == null || !(authentication.getDetails() instanceof Number n)) {
            throw new RuntimeException("Không xác định được người dùng.");
        }
        return n.longValue();
    }

    private String role(Authentication authentication) {
        if (authentication == null) return "";
        return authentication.getAuthorities().stream().map(a -> a.getAuthority())
                .filter(a -> a.startsWith("ROLE_"))
                .findFirst().map(a -> a.substring(5)).orElse("");
    }

    private String providerType(Authentication authentication) {
        if (authentication == null) return null;
        return authentication.getAuthorities().stream().map(a -> a.getAuthority())
                .filter(a -> a.startsWith("PROVIDER_TYPE_"))
                .findFirst().map(a -> a.substring("PROVIDER_TYPE_".length())).orElse(null);
    }

    private void requireProviderOrAdmin(Authentication authentication) {
        String r = role(authentication);
        if (!"PROVIDER".equals(r) && !"ADMIN".equals(r)) {
            throw new com.example.promotionservice.exception.ApiException(HttpStatus.FORBIDDEN, "Chỉ PROVIDER hoặc ADMIN được phép quản lý ưu đãi.");
        }
    }
}
