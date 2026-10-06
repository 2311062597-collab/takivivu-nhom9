package com.example.promotionservice.service;

import com.example.promotionservice.dto.*;
import com.example.promotionservice.entity.*;
import com.example.promotionservice.exception.ApiException;
import com.example.promotionservice.repository.PromotionRepository;
import com.example.promotionservice.repository.PromotionUsageRepository;
import com.example.promotionservice.repository.SavedPromotionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PromotionService {
    private final PromotionRepository promotionRepository;
    private final PromotionUsageRepository usageRepository;
    private final SavedPromotionRepository savedPromotionRepository;
    private final RestClient restClient = RestClient.create();

    @Value("${promotion.internal-token}")
    private String internalToken;
    @Value("${service.flight.url}")
    private String flightUrl;
    @Value("${service.hotel.url}")
    private String hotelUrl;
    @Value("${service.attraction.url}")
    private String attractionUrl;
    @Value("${service.auth.url}")
    private String authUrl;
    @Value("${auth.internal-token}")
    private String authInternalToken;

    public PromotionService(PromotionRepository promotionRepository, PromotionUsageRepository usageRepository, SavedPromotionRepository savedPromotionRepository) {
        this.promotionRepository = promotionRepository;
        this.usageRepository = usageRepository;
        this.savedPromotionRepository = savedPromotionRepository;
    }


    @Transactional
    public PromotionResponseDTO saveForCustomer(Long promotionId, Long customerId) {
        Promotion promotion = getPromotion(promotionId);
        PromotionStatus status = effectiveStatus(promotion);
        if (status == PromotionStatus.INACTIVE || status == PromotionStatus.EXPIRED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ưu đãi đã hết hiệu lực hoặc đã ngừng.");
        }
        if (!savedPromotionRepository.existsByCustomerIdAndPromotionId(customerId, promotionId)) {
            SavedPromotion saved = new SavedPromotion();
            saved.setCustomerId(customerId);
            saved.setPromotion(promotion);
            savedPromotionRepository.save(saved);
        }
        return toResponse(promotion);
    }

    @Transactional(readOnly = true)
    public List<PromotionResponseDTO> listSavedForCustomer(Long customerId) {
        return savedPromotionRepository.findByCustomerIdOrderBySavedAtDesc(customerId).stream()
                .map(SavedPromotion::getPromotion)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void removeSavedForCustomer(Long promotionId, Long customerId) {
        savedPromotionRepository.deleteByCustomerIdAndPromotionId(customerId, promotionId);
    }

    public String generateUniqueCode() {
        for (int i = 0; i < 20; i++) {
            String code = "TAKI" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
            if (!promotionRepository.existsByCodeIgnoreCase(code)) return code;
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo mã ưu đãi duy nhất. Vui lòng thử lại.");
    }

    public List<PromotionResponseDTO> listMine(Long userId, String role) {
        List<Promotion> list = "ADMIN".equals(role)
                ? promotionRepository.findAllByOrderByIdDesc()
                : promotionRepository.findByProviderIdOrderByIdDesc(userId);
        return list.stream().map(this::toResponse).toList();
    }

    public List<PromotionResponseDTO> listAvailable(ServiceType serviceType, Long serviceId, Long providerId) {
        return promotionRepository.findAllByOrderByIdDesc().stream()
                .filter(p -> effectiveStatus(p) == PromotionStatus.ACTIVE)
                .filter(p -> hasCapacity(p))
                .filter(p -> serviceType == null || p.getServiceType() == serviceType)
                .filter(p -> providerId == null || p.getProviderId() == null || Objects.equals(p.getProviderId(), providerId))
                .filter(p -> serviceId == null || p.getScopes().isEmpty() || p.getScopes().stream().anyMatch(s -> Objects.equals(s.getServiceId(), serviceId)))
                .map(this::toResponse)
                .toList();
    }

    public PromotionResponseDTO publicDetail(Long id) {
        Promotion p = getPromotion(id);
        if (effectiveStatus(p) == PromotionStatus.INACTIVE) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy ưu đãi.");
        }
        return toResponse(p);
    }

    public PromotionResponseDTO detail(Long id, Long userId, String role) {
        Promotion p = getPromotion(id);
        requireOwnerOrAdmin(p, userId, role);
        return toResponse(p);
    }

    @Transactional
    public PromotionResponseDTO create(PromotionRequestDTO request, Long userId, String role, String providerType, String authorization) {
        validateRequest(request);
        String code = normalizeCode(request.getCode());
        if (code.isBlank() || promotionRepository.existsByCodeIgnoreCase(code)) {
            code = generateUniqueCode();
        }
        validateProviderScope(request, userId, role, providerType, authorization);

        Promotion p = new Promotion();
        p.setProviderId("ADMIN".equals(role) ? null : userId);
        p.setCreatedBy(userId);
        p.setProviderName("ADMIN".equals(role) ? "TAKIVIVU" : resolveProviderName(userId));
        applyRequest(p, request, code);
        p.setUsedCount(0);
        p.setStatus(computeInitialStatus(request.getStartDate(), request.getEndDate()));
        setScopes(p, request.getServiceIds());
        return toResponse(promotionRepository.save(p));
    }

    @Transactional
    public PromotionResponseDTO update(Long id, PromotionRequestDTO request, Long userId, String role, String providerType, String authorization) {
        Promotion p = getPromotion(id);
        requireOwnerOrAdmin(p, userId, role);
        if (effectiveStatus(p) == PromotionStatus.EXPIRED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ưu đãi đã hết hạn, không thể thay đổi thông tin ảnh hưởng giao dịch.");
        }
        validateRequest(request);
        String code = normalizeCode(request.getCode());
        if (promotionRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Mã ưu đãi đã tồn tại.");
        }
        validateProviderScope(request, userId, role, providerType, authorization);
        if (usageRepository.existsByPromotionId(id) && !Objects.equals(p.getCode(), code)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể đổi mã ưu đãi đã phát sinh Booking.");
        }
        applyRequest(p, request, code);
        if (p.getStatus() != PromotionStatus.INACTIVE) {
            p.setStatus(computeInitialStatus(request.getStartDate(), request.getEndDate()));
        }
        setScopes(p, request.getServiceIds());
        return toResponse(promotionRepository.save(p));
    }

    @Transactional
    public PromotionResponseDTO deactivate(Long id, Long userId, String role) {
        Promotion p = getPromotion(id);
        requireOwnerOrAdmin(p, userId, role);
        if (p.getStatus() == PromotionStatus.INACTIVE) return toResponse(p);
        p.setStatus(PromotionStatus.INACTIVE);
        return toResponse(promotionRepository.save(p));
    }

    @Transactional
    public Map<String,Object> deleteOrDeactivate(Long id, Long userId, String role) {
        Promotion p = getPromotion(id);
        requireOwnerOrAdmin(p, userId, role);
        boolean used = usageRepository.existsByPromotionId(id);
        if (used) {
            p.setStatus(PromotionStatus.INACTIVE);
            promotionRepository.save(p);
            return Map.of("deleted", false, "deactivated", true, "message", "Ưu đãi đã phát sinh giao dịch nên được chuyển sang INACTIVE.");
        }
        promotionRepository.delete(p);
        return Map.of("deleted", true, "deactivated", false, "message", "Xóa ưu đãi thành công.");
    }

    public PromotionCheckResponseDTO validate(PromotionCheckRequestDTO request) {
        Promotion p = findByCode(request.getCode());
        return evaluate(p, request, true);
    }

    @Transactional
    public PromotionCheckResponseDTO reserve(PromotionCheckRequestDTO request, String token) {
        checkInternal(token);
        if (request.getBookingId() == null) throw new ApiException(HttpStatus.BAD_REQUEST, "bookingId là bắt buộc.");

        Optional<PromotionUsage> existing = usageRepository.findByBookingId(request.getBookingId());
        if (existing.isPresent()) {
            PromotionUsage u = existing.get();
            if (u.getStatus() == UsageStatus.CANCELLED) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Ưu đãi của Booking này đã được hủy.");
            }
            if (!Objects.equals(u.getPromotion().getCode(), normalizeCode(request.getCode()))) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Booking này đã giữ một mã ưu đãi khác.");
            }
            PromotionCheckResponseDTO current = evaluate(u.getPromotion(), request, false);
            current.setDiscountAmount(u.getDiscountAmount());
            current.setFinalAmount(request.getTotalAmount().subtract(u.getDiscountAmount()).max(BigDecimal.ZERO));
            return current;
        }

        Promotion p = findByCodeForUpdate(request.getCode());
        PromotionCheckResponseDTO result = evaluate(p, request, true);
        PromotionUsage usage = new PromotionUsage();
        usage.setPromotion(p);
        usage.setCustomerId(request.getCustomerId());
        usage.setBookingId(request.getBookingId());
        usage.setDiscountAmount(result.getDiscountAmount());
        usage.setStatus(UsageStatus.RESERVED);
        usageRepository.save(usage);
        return result;
    }

    @Transactional
    public PromotionCheckResponseDTO revalidate(PromotionCheckRequestDTO request, String token) {
        checkInternal(token);
        if (request.getBookingId() == null) throw new ApiException(HttpStatus.BAD_REQUEST, "bookingId là bắt buộc.");
        PromotionUsage usage = usageRepository.findByBookingId(request.getBookingId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking chưa giữ ưu đãi."));
        if (usage.getStatus() != UsageStatus.RESERVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ưu đãi của Booking không còn ở trạng thái RESERVED.");
        }
        Promotion p = promotionRepository.findByIdForUpdate(usage.getPromotion().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy ưu đãi."));
        PromotionCheckResponseDTO result = evaluate(p, request, false);
        usage.setDiscountAmount(result.getDiscountAmount());
        usageRepository.save(usage);
        return result;
    }

    @Transactional
    public void confirm(Long bookingId, String token) {
        checkInternal(token);
        PromotionUsage usage = usageRepository.findByBookingId(bookingId).orElse(null);
        if (usage == null || usage.getStatus() == UsageStatus.CONFIRMED) return;
        if (usage.getStatus() != UsageStatus.RESERVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ưu đãi của Booking không thể xác nhận.");
        }
        Promotion p = promotionRepository.findByIdForUpdate(usage.getPromotion().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy ưu đãi."));
        usage.setStatus(UsageStatus.CONFIRMED);
        usage.setConfirmedAt(LocalDateTime.now());
        usageRepository.save(usage);
        p.setUsedCount((p.getUsedCount() == null ? 0 : p.getUsedCount()) + 1);
        promotionRepository.save(p);
    }

    @Transactional
    public void release(Long bookingId, String token) {
        checkInternal(token);
        PromotionUsage usage = usageRepository.findByBookingId(bookingId).orElse(null);
        if (usage == null || usage.getStatus() == UsageStatus.CANCELLED || usage.getStatus() == UsageStatus.CONFIRMED) return;
        usage.setStatus(UsageStatus.CANCELLED);
        usage.setCancelledAt(LocalDateTime.now());
        usageRepository.save(usage);
    }

    private PromotionCheckResponseDTO evaluate(Promotion p, PromotionCheckRequestDTO request, boolean checkUsageLimits) {
        PromotionStatus status = effectiveStatus(p);
        if (status == PromotionStatus.EXPIRED) throw new ApiException(HttpStatus.BAD_REQUEST, "Ưu đãi đã hết hạn.");
        if (status == PromotionStatus.SCHEDULED) throw new ApiException(HttpStatus.BAD_REQUEST, "Ưu đãi chưa bắt đầu.");
        if (status != PromotionStatus.ACTIVE) throw new ApiException(HttpStatus.BAD_REQUEST, "Ưu đãi hiện không hoạt động.");
        if (request.getTotalAmount().compareTo(nvl(p.getMinOrderAmount())) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Đơn hàng chưa đạt giá trị tối thiểu " + nvl(p.getMinOrderAmount()) + ".");
        }

        if (checkUsageLimits) {
            List<UsageStatus> counted = List.of(UsageStatus.RESERVED, UsageStatus.CONFIRMED);
            long usageCount = usageRepository.countByPromotionIdAndStatusIn(p.getId(), counted);
            if (p.getMaxUsage() != null && usageCount >= p.getMaxUsage()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Ưu đãi đã hết lượt sử dụng.");
            }
            long customerCount = usageRepository.countByPromotionIdAndCustomerIdAndStatusIn(p.getId(), request.getCustomerId(), counted);
            if (p.getMaxUsagePerCustomer() != null && customerCount >= p.getMaxUsagePerCustomer()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn đã đạt giới hạn sử dụng ưu đãi này.");
            }
        }

        BigDecimal eligible = request.getItems().stream()
                .filter(item -> item.getServiceType() == p.getServiceType())
                .filter(item -> p.getProviderId() == null || Objects.equals(item.getProviderId(), p.getProviderId()))
                .filter(item -> p.getScopes().isEmpty() || p.getScopes().stream().anyMatch(s -> Objects.equals(s.getServiceId(), item.getServiceId())))
                .map(PromotionItemDTO::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (eligible.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ưu đãi không áp dụng cho dịch vụ này.");
        }

        BigDecimal discount;
        if (p.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = eligible.multiply(p.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (p.getMaxDiscountAmount() != null) discount = discount.min(p.getMaxDiscountAmount());
        } else {
            discount = p.getDiscountValue().min(eligible);
        }
        discount = discount.min(request.getTotalAmount()).max(BigDecimal.ZERO);
        return PromotionCheckResponseDTO.builder()
                .valid(true).promotionId(p.getId()).promotionCode(p.getCode())
                .originalAmount(request.getTotalAmount()).eligibleAmount(eligible)
                .discountAmount(discount).finalAmount(request.getTotalAmount().subtract(discount).max(BigDecimal.ZERO))
                .message("Áp dụng ưu đãi thành công.").build();
    }

    private void validateRequest(PromotionRequestDTO r) {
        String name = r.getName() == null ? "" : r.getName().trim();
        if (name.length() < 3 || name.length() > 150) throw new ApiException(HttpStatus.BAD_REQUEST, "Tên ưu đãi phải từ 3 đến 150 ký tự.");
        if (r.getDescription() != null && r.getDescription().trim().length() > 500) throw new ApiException(HttpStatus.BAD_REQUEST, "Mô tả ưu đãi tối đa 500 ký tự.");
        validateImageData(r.getImageUrl());
        if (r.getDiscountValue() == null || r.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Giá trị giảm phải lớn hơn 0.");
        if (r.getDiscountType() == DiscountType.PERCENTAGE && r.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Phần trăm giảm không được vượt quá 100%.");
        if (r.getMinOrderAmount() != null && r.getMinOrderAmount().compareTo(BigDecimal.ZERO) < 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Giá trị đơn tối thiểu không được âm.");
        if (r.getMaxDiscountAmount() != null && r.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Mức giảm tối đa phải lớn hơn 0.");
        if (r.getStartDate() == null || r.getStartDate().isBefore(LocalDate.now())) throw new ApiException(HttpStatus.BAD_REQUEST, "Ngày bắt đầu không được ở trong quá khứ.");
        if (r.getEndDate() == null || !r.getEndDate().isAfter(r.getStartDate())) throw new ApiException(HttpStatus.BAD_REQUEST, "Ngày kết thúc phải sau ngày bắt đầu.");
        if (r.getMaxUsage() == null || r.getMaxUsage() <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Số lượt sử dụng tối đa phải lớn hơn 0.");
        if (r.getMaxUsagePerCustomer() == null || r.getMaxUsagePerCustomer() <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Giới hạn mỗi khách hàng phải lớn hơn 0.");
        if (r.getMaxUsagePerCustomer() > r.getMaxUsage()) throw new ApiException(HttpStatus.BAD_REQUEST, "Giới hạn mỗi khách hàng không được lớn hơn tổng lượt sử dụng.");
        if (r.getServiceType() == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Loại dịch vụ áp dụng là bắt buộc.");
    }

    private void validateImageData(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        String value = imageUrl.trim();
        if (!value.startsWith("data:image/jpeg;base64,")
                && !value.startsWith("data:image/png;base64,")
                && !value.startsWith("data:image/webp;base64,")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ảnh ưu đãi chỉ hỗ trợ JPG, PNG hoặc WEBP.");
        }
        int comma = value.indexOf(',');
        if (comma < 0 || comma == value.length() - 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Dữ liệu ảnh ưu đãi không hợp lệ.");
        }
        String base64 = value.substring(comma + 1);
        long padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
        long estimatedBytes = (base64.length() * 3L) / 4L - padding;
        if (estimatedBytes > 3L * 1024L * 1024L) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ảnh ưu đãi tối đa 3MB.");
        }
    }

    private void validateProviderScope(PromotionRequestDTO r, Long userId, String role, String providerType, String authorization) {
        if ("ADMIN".equals(role)) return;
        if (!"PROVIDER".equals(role)) throw new ApiException(HttpStatus.FORBIDDEN, "Chỉ PROVIDER hoặc ADMIN được quản lý ưu đãi.");
        if (providerType == null || !providerType.equals(r.getServiceType().name())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền tạo ưu đãi cho loại dịch vụ này.");
        }
        if (r.getServiceIds() == null) return;
        for (Long serviceId : r.getServiceIds()) {
            if (serviceId == null) continue;
            Long owner = resolveOwner(r.getServiceType(), serviceId, authorization);
            if (!Objects.equals(owner, userId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền tạo ưu đãi cho dịch vụ này.");
            }
        }
    }

    private Long resolveOwner(ServiceType type, Long serviceId, String authorization) {
        try {
            if (type == ServiceType.FLIGHT) {
                Map<?,?> flight = get(flightUrl + "/api/flights/" + serviceId, authorization);
                return toLong(flight.get("nhaCungCapId"));
            }
            if (type == ServiceType.HOTEL) {
                Map<?,?> room = get(hotelUrl + "/api/hotels/rooms/" + serviceId, authorization);
                Map<?,?> hotel = get(hotelUrl + "/api/hotels/" + toLong(room.get("khachSanId")), authorization);
                return toLong(hotel.get("nhaCungCapId"));
            }
            Map<?,?> ticket = get(attractionUrl + "/api/attractions/tickets/" + serviceId, authorization);
            Map<?,?> attraction = get(attractionUrl + "/api/attractions/" + toLong(ticket.get("diaDiemId")), authorization);
            return toLong(attraction.get("nhaCungCapId"));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không xác minh được dịch vụ áp dụng: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<?,?> get(String url, String authorization) {
        RestClient.RequestHeadersSpec<?> spec = restClient.get().uri(url);
        if (authorization != null && !authorization.isBlank()) spec = spec.header(HttpHeaders.AUTHORIZATION, authorization);
        return spec.retrieve().body(Map.class);
    }

    private void applyRequest(Promotion p, PromotionRequestDTO r, String code) {
        p.setName(r.getName().trim());
        p.setCode(code);
        p.setDescription(r.getDescription() == null ? null : r.getDescription().trim());
        p.setImageUrl(r.getImageUrl());
        p.setDiscountType(r.getDiscountType());
        p.setDiscountValue(r.getDiscountValue());
        p.setMinOrderAmount(nvl(r.getMinOrderAmount()));
        p.setMaxDiscountAmount(r.getDiscountType() == DiscountType.PERCENTAGE ? r.getMaxDiscountAmount() : null);
        p.setStartDate(r.getStartDate());
        p.setEndDate(r.getEndDate());
        p.setMaxUsage(r.getMaxUsage());
        p.setMaxUsagePerCustomer(r.getMaxUsagePerCustomer());
        p.setServiceType(r.getServiceType());
    }

    private void setScopes(Promotion p, List<Long> serviceIds) {
        p.getScopes().clear();
        if (serviceIds == null) return;
        serviceIds.stream().filter(Objects::nonNull).distinct().forEach(id -> {
            PromotionServiceScope s = new PromotionServiceScope();
            s.setPromotion(p);
            s.setServiceId(id);
            p.getScopes().add(s);
        });
    }

    private Promotion getPromotion(Long id) {
        return promotionRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy ưu đãi."));
    }

    private Promotion findByCode(String code) {
        return promotionRepository.findByCodeIgnoreCase(normalizeCode(code))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Mã ưu đãi không hợp lệ."));
    }

    private Promotion findByCodeForUpdate(String code) {
        Promotion p = findByCode(code);
        return promotionRepository.findByIdForUpdate(p.getId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy ưu đãi."));
    }

    private void requireOwnerOrAdmin(Promotion p, Long userId, String role) {
        if ("ADMIN".equals(role)) return;
        if (!"PROVIDER".equals(role) || !Objects.equals(p.getProviderId(), userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác ưu đãi này.");
        }
    }

    private PromotionResponseDTO toResponse(Promotion p) {
        return PromotionResponseDTO.builder()
                .id(p.getId()).providerId(p.getProviderId()).createdBy(p.getCreatedBy()).providerName(p.getProviderName())
                .name(p.getName()).code(p.getCode()).description(p.getDescription()).imageUrl(p.getImageUrl())
                .discountType(p.getDiscountType()).discountValue(p.getDiscountValue())
                .minOrderAmount(p.getMinOrderAmount()).maxDiscountAmount(p.getMaxDiscountAmount())
                .startDate(p.getStartDate()).endDate(p.getEndDate()).maxUsage(p.getMaxUsage())
                .maxUsagePerCustomer(p.getMaxUsagePerCustomer()).usedCount(p.getUsedCount())
                .status(effectiveStatus(p)).serviceType(p.getServiceType())
                .serviceIds(p.getScopes().stream().map(PromotionServiceScope::getServiceId).toList())
                .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt()).build();
    }

    private PromotionStatus effectiveStatus(Promotion p) {
        if (p.getStatus() == PromotionStatus.INACTIVE) return PromotionStatus.INACTIVE;
        LocalDate today = LocalDate.now();
        if (p.getEndDate().isBefore(today)) return PromotionStatus.EXPIRED;
        if (p.getStartDate().isAfter(today)) return PromotionStatus.SCHEDULED;
        return PromotionStatus.ACTIVE;
    }

    private PromotionStatus computeInitialStatus(LocalDate start, LocalDate end) {
        LocalDate today = LocalDate.now();
        if (end.isBefore(today)) return PromotionStatus.EXPIRED;
        if (start.isAfter(today)) return PromotionStatus.SCHEDULED;
        return PromotionStatus.ACTIVE;
    }

    private boolean hasCapacity(Promotion p) {
        if (p.getMaxUsage() == null) return true;
        long count = usageRepository.countByPromotionIdAndStatusIn(p.getId(), List.of(UsageStatus.RESERVED, UsageStatus.CONFIRMED));
        return count < p.getMaxUsage();
    }

    private void checkInternal(String token) {
        if (token == null || !internalToken.equals(token)) throw new ApiException(HttpStatus.FORBIDDEN, "Internal token không hợp lệ.");
    }

    @SuppressWarnings("unchecked")
    private String resolveProviderName(Long userId) {
        try {
            Map<?,?> user = restClient.get()
                    .uri(authUrl + "/api/auth/users/" + userId + "/contact")
                    .header("X-Internal-Token", authInternalToken)
                    .retrieve().body(Map.class);
            Object name = user == null ? null : user.get("hoTen");
            return name == null || name.toString().isBlank() ? "Nhà cung cấp #" + userId : name.toString();
        } catch (Exception e) {
            return "Nhà cung cấp #" + userId;
        }
    }

    private String normalizeCode(String code) { return code == null ? "" : code.trim().toUpperCase(Locale.ROOT); }
    private BigDecimal nvl(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
    private Long toLong(Object v) { if (v == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Không xác định được nhà cung cấp của dịch vụ."); return Long.valueOf(v.toString()); }
}
