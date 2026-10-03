package com.example.bookingservice.service;

import com.example.bookingservice.dto.*;
import com.example.bookingservice.entity.*;
import com.example.bookingservice.repository.BookingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final BookingRepository bookingRepository;
    private final RestClient restClient;

    @Value("${service.flight.url}")
    private String flightUrl;

    @Value("${service.hotel.url}")
    private String hotelUrl;

    @Value("${service.attraction.url}")
    private String attractionUrl;

    @Value("${service.promotion.url}")
    private String promotionUrl;

    @Value("${promotion.internal-token}")
    private String promotionInternalToken;

    @Value("${booking.internal-token}")
    private String bookingInternalToken;

    @Value("${service.inventory.internal-token}")
    private String inventoryInternalToken;

    @Value("${service.payment.url:http://localhost:8086}")
    private String paymentUrl;

    @Value("${booking.provider-confirm-minutes:3}")
    private long providerConfirmMinutes;

    @Value("${service.notification.url}")
    private String notificationUrl;

    @Value("${notification.internal-token}")
    private String notificationInternalToken;

    public BookingService(
            BookingRepository bookingRepository
    ) {

        this.bookingRepository =
                bookingRepository;

        this.restClient =
                RestClient.create();
    }

    public Map<String, String> internalPaymentState(Long id, String token) {
        kiemTraInternalToken(token);
        Booking booking = timBooking(id);
        return Map.of("trangThai", booking.getTrangThai().name());
    }

    // =========================================================
    // CREATE BOOKING
    // =========================================================

    @Transactional
    public BookingResponseDTO taoBooking(
            BookingRequestDTO request,
            Long customerId,
            String authorization
    ) {
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<Booking> bookingCu = bookingRepository.findByKhachHangIdAndIdempotencyKey(customerId, request.getIdempotencyKey());
            if (bookingCu.isPresent()) return taoResponse(bookingCu.get());
        }

        Booking booking = new Booking();
        booking.setMaBooking(taoMaBooking());
        booking.setKhachHangId(customerId);
        booking.setTrangThai(TrangThaiBooking.PENDING_PAYMENT);
        booking.setHetHanThanhToan(LocalDateTime.now().plusMinutes(15));
        booking.setIdempotencyKey(request.getIdempotencyKey());
        booking.setTongTienGoc(BigDecimal.ZERO);
        booking.setTongTien(BigDecimal.ZERO);
        booking.setSoTienGiam(BigDecimal.ZERO);

        List<BookingItem> items = new ArrayList<>();
        BigDecimal tongTienGoc = BigDecimal.ZERO;
        for (BookingItemRequestDTO itemRequest : request.getDanhSachDichVu()) {
            BookingItem item = taoBookingItem(booking, itemRequest, authorization);
            items.add(item);
            tongTienGoc = tongTienGoc.add(item.getThanhTien());
        }
        booking.setTongTienGoc(tongTienGoc);
        booking.setTongTien(tongTienGoc);
        booking.setDanhSachItem(items);

        Booking saved = bookingRepository.save(booking);
        boolean daGiuUuDai = false;
        try {
            if (request.getPromotionCode() != null && !request.getPromotionCode().isBlank()) {
                apDungUuDaiLanDau(saved, request.getPromotionCode());
                daGiuUuDai = true;
                saved = bookingRepository.save(saved);
            }
            for (BookingItem item : saved.getDanhSachItem()) {
                taoHold(saved, item, authorization);
            }
        } catch (Exception e) {
            giaiPhongTatCaHold(saved, authorization);
            if (daGiuUuDai) giaiPhongUuDai(saved.getId());
            throw new RuntimeException("Không thể tạo Booking: " + e.getMessage());
        }

        guiThongBaoSauCommit(
                saved.getKhachHangId(),
                "BOOKING_CREATED",
                "Đặt dịch vụ thành công",
                "Booking " + saved.getMaBooking() + " đã được tạo và đang chờ thanh toán.",
                "BOOKING_CREATED:" + saved.getId()
        );
        return taoResponse(saved);
    }

    // =========================================================
    // RECHECK + PRICE
    // =========================================================

    private BookingItem taoBookingItem(
            Booking booking,
            BookingItemRequestDTO request,
            String authorization
    ) {

        return switch (
                request.getLoaiDichVu()
                ) {

            case FLIGHT ->
                    taoFlightItem(
                            booking,
                            request,
                            authorization
                    );

            case HOTEL ->
                    taoHotelItem(
                            booking,
                            request,
                            authorization
                    );

            case ATTRACTION ->
                    taoAttractionItem(
                            booking,
                            request,
                            authorization
                    );
        };
    }

    private BookingItem taoFlightItem(
            Booking booking,
            BookingItemRequestDTO request,
            String authorization
    ) {
        Map<?, ?> flight = get(flightUrl + "/api/flights/" + request.getDichVuId(), authorization);
        Map<?, ?> inventory = get(flightUrl + "/api/flights/" + request.getDichVuId() + "/inventory", authorization);

        List<Map<String,Object>> selected = parseSelectedSeats(request.getThongTinBoSung());
        if (selected.isEmpty()) {
            BigDecimal legacyPrice = toBigDecimal(flight.get("giaVe"));
            Number soGhe = (Number) flight.get("soGheConLai");
            if (soGhe == null || soGhe.intValue() < request.getSoLuong()) {
                throw new RuntimeException("Chuyến bay không đủ ghế");
            }
            Long providerId = toLong(flight.get("nhaCungCapId"));
            return taoItem(booking, request, providerId, legacyPrice,
                    legacyPrice.multiply(BigDecimal.valueOf(request.getSoLuong())));
        }

        if (selected.size() != request.getSoLuong()) {
            throw new RuntimeException("Số ghế đã chọn không khớp số lượng vé");
        }

        Map<String, Map<?,?>> seatsByCode = new HashMap<>();
        Object rawSeats = inventory.get("seats");
        if (rawSeats instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?,?> seat) seatsByCode.put(String.valueOf(seat.get("maGhe")).toUpperCase(), seat);
            }
        }
        Map<String, BigDecimal> farePrice = new HashMap<>();
        Object rawFares = inventory.get("fares");
        if (rawFares instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?,?> fare) farePrice.put(String.valueOf(fare.get("hangVe")), toBigDecimal(fare.get("giaVe")));
            }
        }

        BigDecimal total = BigDecimal.ZERO;
        Set<String> unique = new HashSet<>();
        for (Map<String,Object> chosen : selected) {
            String code = String.valueOf(chosen.get("maGhe")).trim().toUpperCase();
            if (!unique.add(code)) throw new RuntimeException("Ghế " + code + " bị chọn trùng");
            Map<?,?> seat = seatsByCode.get(code);
            if (seat == null) throw new RuntimeException("Ghế " + code + " không thuộc chuyến bay");
            if (!"AVAILABLE".equals(String.valueOf(seat.get("trangThai")))) {
                throw new RuntimeException("Ghế " + code + " vừa được người khác giữ hoặc đặt");
            }
            String fareClass = String.valueOf(seat.get("hangVe"));
            BigDecimal price = farePrice.get(fareClass);
            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Không xác định được giá hạng vé " + fareClass);
            }
            total = total.add(price);
        }

        Long providerId = toLong(flight.get("nhaCungCapId"));
        BigDecimal average = total.divide(BigDecimal.valueOf(selected.size()), 2, java.math.RoundingMode.HALF_UP);
        return taoItem(booking, request, providerId, average, total);
    }

    private List<Map<String,Object>> parseSelectedSeats(String extra) {
        if (extra == null || extra.isBlank()) return List.of();
        try {
            JsonNode root = MAPPER.readTree(extra);
            JsonNode arr = root.get("selectedSeats");
            if (arr == null || !arr.isArray()) return List.of();
            List<Map<String,Object>> result = new ArrayList<>();
            for (JsonNode node : arr) {
                Map<String,Object> item = new LinkedHashMap<>();
                item.put("maGhe", node.path("maGhe").asText());
                item.put("hangVe", node.path("hangVe").asText());
                result.add(item);
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Dữ liệu ghế đã chọn không hợp lệ");
        }
    }

    private Long selectedPhysicalRoomId(String extra) {
        if (extra == null || extra.isBlank()) return null;
        try {
            JsonNode node = MAPPER.readTree(extra).get("phongCuTheId");
            if (node == null || node.isNull()) return null;
            if (!node.canConvertToLong() || node.asLong() <= 0) throw new IllegalArgumentException();
            return node.asLong();
        } catch (Exception e) {
            throw new RuntimeException("Mã phòng cụ thể đã chọn không hợp lệ");
        }
    }

    private List<String> parseSeatCodes(String extra) {
        return parseSelectedSeats(extra).stream()
                .map(x -> String.valueOf(x.get("maGhe")).trim().toUpperCase())
                .filter(x -> !x.isBlank())
                .toList();
    }

    private BookingItem taoHotelItem(
            Booking booking,
            BookingItemRequestDTO request,
            String authorization
    ) {

        if (request.getNgayBatDau() == null
                || request.getNgayKetThuc() == null) {

            throw new RuntimeException(
                    "Hotel phải có ngày nhận và trả phòng"
            );
        }

        long soDem =
                ChronoUnit.DAYS.between(
                        request.getNgayBatDau(),
                        request.getNgayKetThuc()
                );

        if (soDem <= 0) {

            throw new RuntimeException(
                    "Ngày trả phòng phải sau ngày nhận phòng"
            );
        }

        // Lấy giá của đúng phòng cụ thể mà khách chọn, không dùng giá cơ bản loại phòng.
        Long selectedPhysicalId = selectedPhysicalRoomId(request.getThongTinBoSung());
        if (selectedPhysicalId != null && request.getSoLuong() != 1) {
            throw new IllegalArgumentException("Chọn phòng cụ thể chỉ hỗ trợ một phòng");
        }
        String roomUrl = hotelUrl + "/api/hotels/rooms/" + request.getDichVuId()
                + (selectedPhysicalId == null ? "" : "?phongCuTheId=" + selectedPhysicalId);
        Map<?, ?> room = get(roomUrl, authorization);

        BigDecimal gia = toBigDecimal(room.get("giaMoiDem"));
        Long hotelId = toLong(room.get("khachSanId"));
        Map<?, ?> hotel = get(hotelUrl + "/api/hotels/" + hotelId, authorization);
        Long providerId = toLong(hotel.get("nhaCungCapId"));

        BigDecimal thanhTien =
                gia
                        .multiply(
                                BigDecimal.valueOf(
                                        request.getSoLuong()
                                )
                        )
                        .multiply(
                                BigDecimal.valueOf(
                                        soDem
                                )
                        );

        return taoItem(
                booking,
                request,
                providerId,
                gia,
                thanhTien
        );
    }

    private BookingItem taoAttractionItem(
            Booking booking,
            BookingItemRequestDTO request,
            String authorization
    ) {

        if (request.getNgayBatDau() == null) {

            throw new RuntimeException(
                    "Vé tham quan phải có ngày sử dụng"
            );
        }

        Map<?, ?> ticket =
                get(
                        attractionUrl + "/api/attractions/tickets/" + request.getDichVuId(),
                        authorization
                );

        if (!"AVAILABLE".equals(String.valueOf(ticket.get("trangThai")))) {
            throw new RuntimeException("Loại vé tham quan không còn kinh doanh");
        }
        if (request.getSoLuong() == null || request.getSoLuong() <= 0) {
            throw new RuntimeException("Số lượng vé không hợp lệ");
        }
        BigDecimal gia = toBigDecimal(ticket.get("giaVe"));
        Long attractionId = toLong(ticket.get("diaDiemId"));
        Map<?, ?> attraction = get(attractionUrl + "/api/attractions/" + attractionId, authorization);
        if (!"ACTIVE".equals(String.valueOf(attraction.get("trangThai")))) {
            throw new RuntimeException("Địa điểm tham quan đã ngừng hoạt động");
        }
        Long providerId = toLong(attraction.get("nhaCungCapId"));

        BigDecimal thanhTien =
                gia.multiply(
                        BigDecimal.valueOf(
                                request.getSoLuong()
                        )
                );

        return taoItem(
                booking,
                request,
                providerId,
                gia,
                thanhTien
        );
    }

    private BookingItem taoItem(
            Booking booking,
            BookingItemRequestDTO request,
            Long providerId,
            BigDecimal donGia,
            BigDecimal thanhTien
    ) {

        BookingItem item =
                new BookingItem();

        item.setBooking(
                booking
        );

        item.setLoaiDichVu(
                request.getLoaiDichVu()
        );

        item.setDichVuId(
                request.getDichVuId()
        );

        item.setNhaCungCapId(providerId);

        item.setSoLuong(
                request.getSoLuong()
        );

        item.setDonGia(
                donGia
        );

        item.setThanhTien(
                thanhTien
        );

        item.setNgayBatDau(
                request.getNgayBatDau()
        );

        item.setNgayKetThuc(
                request.getNgayKetThuc()
        );

        item.setThongTinBoSung(
                request.getThongTinBoSung()
        );

        return item;
    }

    // =========================================================
    // PROMOTION SERVICE
    // =========================================================

    private void apDungUuDaiLanDau(Booking booking, String code) {
        Map<?, ?> result = postPromotion(
                promotionUrl + "/api/promotions/internal/reserve",
                taoPromotionBody(booking, code)
        );
        ganKetQuaUuDai(booking, result);
    }

    @Transactional
    public BookingResponseDTO chuanBiThanhToan(Long bookingId, String internalToken) {
        kiemTraInternalToken(internalToken);
        Booking booking = timBooking(bookingId);
        if (booking.getTrangThai() != TrangThaiBooking.PENDING_PAYMENT) {
            throw new RuntimeException("Booking không ở trạng thái PENDING_PAYMENT");
        }
        if (booking.getMaUuDai() != null && !booking.getMaUuDai().isBlank()) {
            Map<?, ?> result = postPromotion(
                    promotionUrl + "/api/promotions/internal/revalidate",
                    taoPromotionBody(booking, booking.getMaUuDai())
            );
            ganKetQuaUuDai(booking, result);
            bookingRepository.save(booking);
        }
        return taoResponse(booking);
    }

    private Map<String, Object> taoPromotionBody(Booking booking, String code) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", code);
        body.put("bookingId", booking.getId());
        body.put("customerId", booking.getKhachHangId());
        body.put("totalAmount", booking.getTongTienGoc());
        List<Map<String, Object>> items = booking.getDanhSachItem().stream().map(item -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("serviceType", item.getLoaiDichVu().name());
            m.put("serviceId", item.getDichVuId());
            m.put("providerId", item.getNhaCungCapId());
            m.put("amount", item.getThanhTien());
            return m;
        }).toList();
        body.put("items", items);
        return body;
    }

    private void ganKetQuaUuDai(Booking booking, Map<?, ?> result) {
        booking.setUuDaiId(toLong(result.get("promotionId")));
        booking.setMaUuDai(String.valueOf(result.get("promotionCode")));
        booking.setSoTienGiam(toBigDecimal(result.get("discountAmount")));
        booking.setTongTien(toBigDecimal(result.get("finalAmount")));
    }

    private void xacNhanUuDai(Long bookingId) {
        postPromotionNoBody(promotionUrl + "/api/promotions/internal/bookings/" + bookingId + "/confirm");
    }

    private void giaiPhongUuDai(Long bookingId) {
        try {
            postPromotionNoBody(promotionUrl + "/api/promotions/internal/bookings/" + bookingId + "/release");
        } catch (Exception ignored) {
        }
    }

    // =========================================================
    // HOLD
    // =========================================================

    private void taoHold(
            Booking booking,
            BookingItem item,
            String authorization
    ) {

        switch (item.getLoaiDichVu()) {

            case FLIGHT -> {

                Map<String, Object> body =
                        new HashMap<>();

                body.put(
                        "bookingId",
                        booking.getId()
                );

                body.put(
                        "soLuongGhe",
                        item.getSoLuong()
                );

                List<String> seatCodes = parseSeatCodes(item.getThongTinBoSung());
                if (!seatCodes.isEmpty()) {
                    body.put("seatCodes", seatCodes);
                }

                post(
                        flightUrl
                                + "/api/flights/"
                                + item.getDichVuId()
                                + "/hold",
                        body,
                        authorization
                );
            }

            case HOTEL -> {

                Map<String, Object> body =
                        new HashMap<>();

                body.put(
                        "bookingId",
                        booking.getId()
                );

                body.put(
                        "soLuongPhong",
                        item.getSoLuong()
                );

                body.put(
                        "ngayNhanPhong",
                        item.getNgayBatDau()
                                .toString()
                );

                body.put(
                        "ngayTraPhong",
                        item.getNgayKetThuc()
                                .toString()
                );

                Long selectedPhysicalId = selectedPhysicalRoomId(item.getThongTinBoSung());
                if (selectedPhysicalId != null) {
                    if (item.getSoLuong() != 1) throw new RuntimeException("Chọn phòng cụ thể chỉ hỗ trợ một phòng");
                    body.put("phongCuTheId", selectedPhysicalId);
                }
                post(
                        hotelUrl
                                + "/api/hotels/rooms/"
                                + item.getDichVuId()
                                + "/hold",
                        body,
                        authorization
                );
            }

            case ATTRACTION -> {

                Map<String, Object> body =
                        new HashMap<>();

                body.put(
                        "bookingId",
                        booking.getId()
                );

                body.put(
                        "soLuongVe",
                        item.getSoLuong()
                );

                body.put(
                        "ngaySuDung",
                        item.getNgayBatDau()
                                .toString()
                );

                post(
                        attractionUrl
                                + "/api/attractions/tickets/"
                                + item.getDichVuId()
                                + "/hold",
                        body,
                        authorization
                );
            }
        }
    }

    // =========================================================
    // RELEASE HOLD - CUSTOMER FLOW
    // =========================================================

    private void giaiPhongTatCaHold(
            Booking booking,
            String authorization
    ) {

        Set<LoaiDichVu> daXuLy =
                new HashSet<>();

        for (BookingItem item
                : booking.getDanhSachItem()) {

            if (!daXuLy.add(
                    item.getLoaiDichVu()
            )) {
                continue;
            }

            try {

                switch (item.getLoaiDichVu()) {

                    case FLIGHT ->
                            put(
                                    flightUrl
                                            + "/api/flights/holds/"
                                            + booking.getId()
                                            + "/release",
                                    authorization
                            );

                    case HOTEL ->
                            put(
                                    hotelUrl
                                            + "/api/hotels/holds/"
                                            + booking.getId()
                                            + "/release",
                                    authorization
                            );

                    case ATTRACTION ->
                            put(
                                    attractionUrl
                                            + "/api/attractions/holds/"
                                            + booking.getId()
                                            + "/release",
                                    authorization
                            );
                }

            } catch (Exception cleanupError) {
                // Cross-service calls are not covered by this service's DB transaction.
                // Never hide failed compensation: operators must reconcile these holds.
                log.error("HOLD_COMPENSATION_FAILED bookingId={} service={}: manual reconciliation required",
                        booking.getId(), item.getLoaiDichVu(), cleanupError);
            }
        }
    }

    // =========================================================
    // INTERNAL HOLD CONFIRM
    // =========================================================

    private void xacNhanTatCaHoldNoiBo(
            Booking booking
    ) {

        Set<LoaiDichVu> daXuLy =
                new HashSet<>();

        for (BookingItem item
                : booking.getDanhSachItem()) {

            if (!daXuLy.add(
                    item.getLoaiDichVu()
            )) {
                continue;
            }

            switch (item.getLoaiDichVu()) {

                case FLIGHT ->
                        putInternal(
                                flightUrl
                                        + "/api/flights/internal/holds/"
                                        + booking.getId()
                                        + "/confirm"
                        );

                case HOTEL ->
                        putInternal(
                                hotelUrl
                                        + "/api/hotels/internal/holds/"
                                        + booking.getId()
                                        + "/confirm"
                        );

                case ATTRACTION ->
                        putInternal(
                                attractionUrl
                                        + "/api/attractions/internal/holds/"
                                        + booking.getId()
                                        + "/confirm"
                        );
            }
        }
    }

    private void giaiPhongTatCaHoldNoiBo(
            Booking booking
    ) {

        Set<LoaiDichVu> daXuLy =
                new HashSet<>();

        for (BookingItem item
                : booking.getDanhSachItem()) {

            if (!daXuLy.add(
                    item.getLoaiDichVu()
            )) {
                continue;
            }

            try {

                switch (item.getLoaiDichVu()) {

                    case FLIGHT ->
                            putInternal(
                                    flightUrl
                                            + "/api/flights/internal/holds/"
                                            + booking.getId()
                                            + "/release"
                            );

                    case HOTEL ->
                            putInternal(
                                    hotelUrl
                                            + "/api/hotels/internal/holds/"
                                            + booking.getId()
                                            + "/release"
                            );

                    case ATTRACTION ->
                            putInternal(
                                    attractionUrl
                                            + "/api/attractions/internal/holds/"
                                            + booking.getId()
                                            + "/release"
                            );
                }

            } catch (Exception cleanupError) {
                log.error("INTERNAL_HOLD_RELEASE_FAILED bookingId={} service={}",
                        booking.getId(), item.getLoaiDichVu(), cleanupError);
                throw new IllegalStateException("Không giải phóng được chỗ; lần quét sau sẽ thử lại", cleanupError);
            }
        }
    }

    // Refund cancellation is different from releasing an unpaid hold:
    // confirmed physical rooms require the Hotel Service's dedicated internal endpoint.
    private void giaiPhongHoldKhiHoanTien(Booking booking) {
        Set<LoaiDichVu> kinds = new HashSet<>();
        for (BookingItem item : booking.getDanhSachItem()) {
            if (!kinds.add(item.getLoaiDichVu())) continue;
            switch (item.getLoaiDichVu()) {
                case HOTEL -> putInternal(hotelUrl + "/api/hotels/internal/holds/" + booking.getId() + "/refund-release");
                case FLIGHT -> putInternal(flightUrl + "/api/flights/internal/holds/" + booking.getId() + "/refund-release");
                case ATTRACTION -> putInternal(attractionUrl + "/api/attractions/internal/holds/" + booking.getId() + "/refund-release");
            }
        }
    }

    // =========================================================
    // READ
    // =========================================================

    public BookingResponseDTO chiTiet(
            Long bookingId,
            Long userId,
            String role
    ) {

        Booking booking =
                timBooking(
                        bookingId
                );

        kiemTraQuyen(
                booking,
                userId,
                role
        );

        if ("PROVIDER".equals(role)) {
            return taoResponseChoNhaCungCap(booking, userId);
        }
        return taoResponse(
                booking
        );
    }

    public BookingResponseDTO chiTietTheoMaBooking(
            String bookingCode,
            Long userId,
            String role
    ) {

        if (bookingCode == null
                || bookingCode.isBlank()) {

            throw new RuntimeException(
                    "Mã booking không hợp lệ"
            );
        }

        Booking booking =
                bookingRepository
                        .findByMaBooking(
                                bookingCode.trim()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy booking"
                                )
                        );

        kiemTraQuyen(
                booking,
                userId,
                role
        );

        if ("PROVIDER".equals(role)) {
            return taoResponseChoNhaCungCap(booking, userId);
        }
        return taoResponse(
                booking
        );
    }

    public List<BookingResponseDTO>
    bookingCuaKhachHang(
            Long customerId
    ) {

        return bookingRepository
                .findByKhachHangIdOrderByIdDesc(
                        customerId
                )
                .stream()
                .map(
                        this::taoResponse
                )
                .toList();
    }

    public List<BookingResponseDTO> bookingCuaNhaCungCap(Long providerId) {
        return bookingRepository.findVisibleForProvider(providerId)
                .stream()
                .map(booking -> taoResponseChoNhaCungCap(booking, providerId))
                .toList();
    }

    @Transactional
    public BookingResponseDTO customerConfirmBankTransfer(Long bookingId, Long customerId) {
        Booking booking = timBooking(bookingId);
        if (!Objects.equals(booking.getKhachHangId(), customerId)) {
            throw new RuntimeException("Bạn không có quyền xác nhận thanh toán cho Booking này");
        }
        if (booking.getTrangThai() == TrangThaiBooking.PAYMENT_RECEIVED) return taoResponse(booking);
        if (booking.getTrangThai() != TrangThaiBooking.PENDING_PAYMENT) {
            throw new RuntimeException("Booking không ở trạng thái chờ thanh toán");
        }
        // Start a separate three-minute provider confirmation window once the
        // customer reports the transfer. This is NOT proof funds arrived.
        if (booking.getHetHanThanhToan() == null
                || !booking.getHetHanThanhToan().isAfter(LocalDateTime.now()))
            throw new RuntimeException("Đơn đã hết hạn thanh toán, không thể báo chuyển khoản");
        booking.setTrangThai(TrangThaiBooking.PAYMENT_RECEIVED);
        booking.setHetHanThanhToan(LocalDateTime.now().plusMinutes(providerConfirmMinutes));
        Booking claimed = bookingRepository.save(booking);
        guiThongBaoChoNhaCungCapSauCommit(claimed, "PROVIDER_CONFIRM_DEADLINE",
                "Xác nhận chuyển khoản trong 3 phút",
                "Khách đã báo chuyển khoản cho đơn " + claimed.getMaBooking()
                        + ". Vui lòng đối soát trước khi hết hạn.",
                "PROVIDER_CONFIRM_DEADLINE:" + claimed.getId());
        return taoResponse(claimed);
    }

    @Transactional
    public BookingResponseDTO providerConfirmBankTransfer(Long bookingId, Long providerId) {
        Booking booking = timBooking(bookingId);
        boolean owner = booking.getDanhSachItem().stream().anyMatch(item -> Objects.equals(item.getNhaCungCapId(), providerId));
        if (!owner) throw new RuntimeException("Bạn không có quyền xác nhận thanh toán cho Booking này");
        if (booking.getTrangThai() == TrangThaiBooking.CONFIRMED) return taoResponseChoNhaCungCap(booking, providerId);
        if (booking.getTrangThai() != TrangThaiBooking.PAYMENT_RECEIVED) {
            throw new RuntimeException("Khách hàng chưa xác nhận đã chuyển khoản");
        }
        if (booking.getHetHanThanhToan() != null
                && !booking.getHetHanThanhToan().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Đã quá 3 phút xác nhận. Đơn cần đối soát và xử lý hoàn tiền nếu đã nhận tiền.");
        }
        // Provider must reconcile the transfer before calling this action.
        // Payment is synchronized before the booking is confirmed.
        restClient.put()
                .uri(paymentUrl + "/api/payments/internal/bookings/" + booking.getId() + "/provider-confirm")
                .header("X-Internal-Token", bookingInternalToken)
                .retrieve().toBodilessEntity();
        booking.setTrangThai(TrangThaiBooking.PAID);
        bookingRepository.save(booking);
        xacNhanTatCaHoldNoiBo(booking);
        if (booking.getUuDaiId() != null) xacNhanUuDai(booking.getId());
        booking.setTrangThai(TrangThaiBooking.CONFIRMED);
        Booking saved = bookingRepository.save(booking);
        guiThongBaoSauCommit(saved.getKhachHangId(), "BOOKING_CONFIRMED", "Thanh toán đã được xác nhận", "Nhà cung cấp đã xác nhận chuyển khoản cho Booking " + saved.getMaBooking() + ".", "BOOKING_CONFIRMED:" + saved.getId());
        return taoResponseChoNhaCungCap(saved, providerId);
    }

    // Explicit repair for legacy bookings confirmed before Payment was synchronized.
    // Provider must independently verify the bank transfer before using this action.
    // Does not create a second booking or confirm inventory again.
    @Transactional
    public BookingResponseDTO reconcileConfirmedBankTransfer(Long bookingId, Long providerId) {
        Booking booking = timBooking(bookingId);
        boolean owner = booking.getDanhSachItem().stream()
                .anyMatch(item -> Objects.equals(item.getNhaCungCapId(), providerId));
        if (!owner) throw new RuntimeException("Bạn không có quyền đối soát đơn này");
        if (booking.getTrangThai() != TrangThaiBooking.CONFIRMED) {
            throw new RuntimeException("Chỉ đối soát đơn đã xác nhận từ phiên bản cũ");
        }
        // This call is idempotent for an already successful payment.
        // Never change a cancelled/refunded payment to SUCCESS automatically.
        restClient.put()
                .uri(paymentUrl + "/api/payments/internal/bookings/" + booking.getId() + "/provider-confirm")
                .header("X-Internal-Token", bookingInternalToken)
                .retrieve().toBodilessEntity();
        return taoResponseChoNhaCungCap(booking, providerId);
    }

    // =========================================================
    // INTERNAL PAYMENT STATUS
    // =========================================================

    @Transactional
    public BookingResponseDTO internalPaymentReceived(
            Long bookingId,
            String internalToken
    ) {

        kiemTraInternalToken(
                internalToken
        );

        Booking booking =
                timBooking(
                        bookingId
                );

        /*
         * Idempotent:
         * nếu webhook retry sau khi đã nhận tiền,
         * không tạo lỗi vô ích.
         */
        if (booking.getTrangThai()
                == TrangThaiBooking.PAYMENT_RECEIVED
                || booking.getTrangThai()
                == TrangThaiBooking.PAID
                || booking.getTrangThai()
                == TrangThaiBooking.CONFIRMED) {

            return taoResponse(
                    booking
            );
        }

        if (booking.getTrangThai()
                != TrangThaiBooking.PENDING_PAYMENT) {

            throw new RuntimeException(
                    "Booking không ở trạng thái PENDING_PAYMENT"
            );
        }

        booking.setTrangThai(
                TrangThaiBooking.PAYMENT_RECEIVED
        );

        return taoResponse(
                bookingRepository.save(
                        booking
                )
        );
    }

    @Transactional
    public BookingResponseDTO internalPaymentSuccess(
            Long bookingId,
            String internalToken
    ) {

        kiemTraInternalToken(
                internalToken
        );

        Booking booking =
                timBooking(
                        bookingId
                );

        /*
         * Webhook retry:
         * Booking đã CONFIRMED thì trả lại luôn.
         */
        if (booking.getTrangThai()
                == TrangThaiBooking.CONFIRMED) {

            return taoResponse(
                    booking
            );
        }

        /*
         * SUCCESS chỉ hợp lệ sau PAYMENT_RECEIVED.
         */
        if (booking.getTrangThai()
                != TrangThaiBooking.PAYMENT_RECEIVED) {

            throw new RuntimeException(
                    "Booking phải ở trạng thái PAYMENT_RECEIVED trước khi chuyển sang PAID"
            );
        }

        booking.setTrangThai(
                TrangThaiBooking.PAID
        );

        bookingRepository.save(
                booking
        );

        /*
         * Sau khi thanh toán thành công,
         * xác nhận toàn bộ hold.
         */
        xacNhanTatCaHoldNoiBo(
                booking
        );

        if (booking.getUuDaiId() != null) {
            xacNhanUuDai(booking.getId());
        }

        booking.setTrangThai(
                TrangThaiBooking.CONFIRMED
        );

        Booking saved = bookingRepository.save(booking);

        guiThongBaoSauCommit(
                saved.getKhachHangId(),
                "BOOKING_CONFIRMED",
                "Booking đã được xác nhận",
                "Booking " + saved.getMaBooking() + " đã thanh toán và được xác nhận.",
                "BOOKING_CONFIRMED:" + saved.getId()
        );
        guiThongBaoChoNhaCungCapSauCommit(
                saved,
                "PROVIDER_NEW_BOOKING",
                "Có đơn đặt dịch vụ mới",
                "Booking " + saved.getMaBooking() + " đã thanh toán thành công. Vui lòng kiểm tra đơn.",
                "PROVIDER_NEW_BOOKING:" + saved.getId()
        );

        return taoResponse(saved);
    }

    @Transactional
    public BookingResponseDTO internalPaymentFailed(
            Long bookingId,
            String internalToken
    ) {

        kiemTraInternalToken(
                internalToken
        );

        Booking booking =
                timBooking(
                        bookingId
                );

        if (booking.getTrangThai()
                == TrangThaiBooking.CONFIRMED
                || booking.getTrangThai()
                == TrangThaiBooking.COMPLETED) {

            throw new RuntimeException(
                    "Không thể đánh dấu thất bại cho Booking đã xác nhận"
            );
        }

        if (booking.getTrangThai()
                == TrangThaiBooking.PAYMENT_FAILED) {

            return taoResponse(
                    booking
            );
        }

        booking.setTrangThai(
                TrangThaiBooking.PAYMENT_FAILED
        );

        giaiPhongTatCaHoldNoiBo(
                booking
        );

        if (booking.getUuDaiId() != null) {
            giaiPhongUuDai(booking.getId());
        }

        return taoResponse(
                bookingRepository.save(
                        booking
                )
        );
    }

    // =========================================================
    // ADMIN / REFUND STATE
    // =========================================================

    public List<BookingResponseDTO> tatCaBookingChoAdmin() {
        return bookingRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Booking::getId).reversed())
                .map(this::taoResponse)
                .toList();
    }

    @Transactional
    public BookingResponseDTO internalRefundPending(Long bookingId, String internalToken) {
        kiemTraInternalToken(internalToken);
        Booking booking = timBooking(bookingId);
        if (booking.getTrangThai() == TrangThaiBooking.REFUND_PENDING) {
            return taoResponse(booking);
        }
        if (booking.getTrangThai() != TrangThaiBooking.CANCELLED
                && booking.getTrangThai() != TrangThaiBooking.EXPIRED
                && booking.getTrangThai() != TrangThaiBooking.CONFIRMED
                && booking.getTrangThai() != TrangThaiBooking.PAID) {
            throw new RuntimeException("Booking không ở trạng thái cho phép yêu cầu hoàn tiền");
        }
        if (booking.getTrangThai() == TrangThaiBooking.CONFIRMED
                || booking.getTrangThai() == TrangThaiBooking.PAID) {
            giaiPhongHoldKhiHoanTien(booking);
            booking.setTrangThai(TrangThaiBooking.CANCELLED);
            bookingRepository.save(booking);
        }
        booking.setTrangThai(TrangThaiBooking.REFUND_PENDING);
        return taoResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponseDTO internalRefunded(Long bookingId, String internalToken) {
        kiemTraInternalToken(internalToken);
        Booking booking = timBooking(bookingId);
        if (booking.getTrangThai() == TrangThaiBooking.REFUNDED) {
            return taoResponse(booking);
        }
        if (booking.getTrangThai() != TrangThaiBooking.REFUND_PENDING) {
            throw new RuntimeException("Booking phải ở trạng thái REFUND_PENDING trước khi REFUNDED");
        }
        booking.setTrangThai(TrangThaiBooking.REFUNDED);
        return taoResponse(bookingRepository.save(booking));
    }

    // Cancellation applies to the COMPLETE booking (including multi-service bookings).
    private LocalDateTime serviceStart(BookingItem item) {
        if (item.getLoaiDichVu() == LoaiDichVu.FLIGHT) {
            Map<?, ?> flight = restClient.get()
                .uri(flightUrl + "/api/flights/" + item.getDichVuId())
                .retrieve().body(Map.class);
            Object departure = flight == null ? null : flight.get("thoiGianKhoiHanh");
            if (departure == null) throw new RuntimeException("Không xác định được giờ khởi hành");
            return LocalDateTime.parse(String.valueOf(departure));
        }
        // The hotel uses midnight as the conservative cut-off when booking only stores dates;
        // attraction likewise has no guaranteed scheduled start hour in BookingItem.
        if (item.getNgayBatDau() == null)
            throw new RuntimeException("Không tìm thấy ngày sử dụng dịch vụ");
        return item.getNgayBatDau().atStartOfDay();
    }

    @Transactional
    public BookingResponseDTO yeuCauHuyHoanTien(Long bookingId, Long customerId, String reason) {
        Booking booking = timBooking(bookingId);
        if (!Objects.equals(booking.getKhachHangId(), customerId))
            throw new RuntimeException("Bạn không có quyền hủy đơn này");
        if (booking.getTrangThai() == TrangThaiBooking.CANCEL_REQUESTED) return taoResponse(booking);
        if (booking.getTrangThai() != TrangThaiBooking.CONFIRMED
                && booking.getTrangThai() != TrangThaiBooking.PAID)
            throw new RuntimeException("Chỉ đơn thanh toán thành công mới có thể gửi yêu cầu hủy");
        if (reason == null || reason.isBlank() || reason.length() > 500)
            throw new RuntimeException("Vui lòng nhập lý do hủy (tối đa 500 ký tự)");
        LocalDateTime limit = LocalDateTime.now().plusHours(24);
        for (BookingItem item : booking.getDanhSachItem()) {
            if (serviceStart(item).isBefore(limit))
                throw new RuntimeException("Phải yêu cầu hủy trước giờ sử dụng ít nhất 24 giờ");
        }
        booking.setLyDoHuy(reason.trim());
        booking.setLyDoTuChoiHuy(null);
        booking.setHanXuLyHuy(LocalDateTime.now().plusHours(2));
        booking.setTrangThai(TrangThaiBooking.CANCEL_REQUESTED);
        Booking saved = bookingRepository.save(booking);
        guiThongBaoChoNhaCungCapSauCommit(saved, "CANCEL_REQUESTED", "Yêu cầu hủy/hoàn tiền",
                "Đơn " + saved.getMaBooking() + " có yêu cầu hủy, thời hạn xử lý 2 giờ. Lý do: " + reason,
                "CANCEL_REQUESTED:" + saved.getId());
        guiThongBaoSauCommit(saved.getKhachHangId(), "CANCEL_REQUESTED", "Đã nhận yêu cầu hủy",
                "Yêu cầu hủy đơn " + saved.getMaBooking() + " đang chờ nhà cung cấp xử lý.",
                "CANCEL_REQUESTED:" + saved.getId());
        return taoResponse(saved);
    }

    private void hoanTienVaHuy(Booking booking, String source) {
        // Payment is marked refunded before the confirmed inventory is released.
        // A retry finds REFUNDED and is idempotent in Payment Service.
        restClient.put().uri(paymentUrl + "/api/payments/internal/bookings/"
                + booking.getId() + "/mock-refund")
                .header("X-Internal-Token", bookingInternalToken)
                .retrieve().toBodilessEntity();
        giaiPhongHoldKhiHoanTien(booking);
        booking.setTrangThai(TrangThaiBooking.CANCELLED);
        booking.setHanXuLyHuy(null);
        Booking saved = bookingRepository.save(booking);
        guiThongBaoSauCommit(saved.getKhachHangId(), "REFUND_SUCCESS", "Đã duyệt hủy/hoàn tiền mô phỏng",
                "Đơn " + saved.getMaBooking() + " đã hủy, ghi nhận hoàn tiền mô phỏng và giải phóng chỗ (" + source + ").",
                "MOCK_REFUND:" + saved.getId());
        guiThongBaoChoNhaCungCapSauCommit(saved, "BOOKING_CANCELLED", "Đơn đã được hủy",
                "Đơn " + saved.getMaBooking() + " đã hủy và hoàn tiền mô phỏng.",
                "MOCK_REFUND:" + saved.getId());
    }

    @Transactional
    public BookingResponseDTO providerResolveCancellation(Long bookingId, Long providerId,
            boolean approved, String rejectReason) {
        Booking booking = timBooking(bookingId);
        if (booking.getDanhSachItem().stream().noneMatch(i -> Objects.equals(i.getNhaCungCapId(), providerId)))
            throw new RuntimeException("Nhà cung cấp không sở hữu dịch vụ này");
        if (booking.getTrangThai() != TrangThaiBooking.CANCEL_REQUESTED)
            throw new RuntimeException("Đơn không có yêu cầu hủy đang chờ");
        if (booking.getHanXuLyHuy() == null || !booking.getHanXuLyHuy().isAfter(LocalDateTime.now()))
            throw new RuntimeException("Đã hết thời hạn. Hệ thống sẽ tự xử lý yêu cầu.");
        if (approved) hoanTienVaHuy(booking, "Provider duyệt");
        else {
            if (rejectReason == null || rejectReason.isBlank() || rejectReason.length() > 500)
                throw new RuntimeException("Bắt buộc nhập lý do từ chối (tối đa 500 ký tự)");
            booking.setLyDoTuChoiHuy(rejectReason.trim());
            booking.setHanXuLyHuy(null);
            booking.setTrangThai(TrangThaiBooking.CONFIRMED);
            bookingRepository.save(booking);
            guiThongBaoSauCommit(booking.getKhachHangId(), "CANCEL_REJECTED", "Yêu cầu hủy bị từ chối",
                    "Đơn " + booking.getMaBooking() + ": " + rejectReason.trim(),
                    "CANCEL_REJECTED:" + booking.getId());
        }
        return taoResponse(booking);
    }

    @Transactional
    public void tuDongDuyetYeuCauHuy(Long bookingId) {
        Booking booking = timBooking(bookingId);
        if (booking.getTrangThai() != TrangThaiBooking.CANCEL_REQUESTED
                || booking.getHanXuLyHuy() == null
                || booking.getHanXuLyHuy().isAfter(LocalDateTime.now())) return;
        hoanTienVaHuy(booking, "Tự động duyệt do Provider không phản hồi sau 2 giờ");
    }

    // =========================================================
    // CANCEL / EXPIRE
    // =========================================================

    @Transactional
    public BookingResponseDTO huyBooking(
            Long bookingId,
            Long customerId,
            String authorization
    ) {

        Booking booking =
                timBooking(
                        bookingId
                );

        if (!booking
                .getKhachHangId()
                .equals(customerId)) {

            throw new RuntimeException(
                    "Bạn không có quyền hủy booking này"
            );
        }

        TrangThaiBooking trangThaiHienTai = booking.getTrangThai();

        if (trangThaiHienTai != TrangThaiBooking.PENDING_PAYMENT) {
            if (trangThaiHienTai == TrangThaiBooking.PAID
                    || trangThaiHienTai == TrangThaiBooking.CONFIRMED) {
                throw new RuntimeException(
                        "Đơn đã thanh toán. Vui lòng gửi yêu cầu hoàn tiền thay vì hủy trực tiếp"
                );
            }
            throw new RuntimeException(
                    "Chỉ đơn đang chờ thanh toán mới được hủy trực tiếp"
            );
        }

        giaiPhongTatCaHold(booking, authorization);
        if (booking.getUuDaiId() != null) {
            giaiPhongUuDai(booking.getId());
        }

        booking.setTrangThai(
                TrangThaiBooking.CANCELLED
        );

        Booking saved = bookingRepository.save(booking);

        guiThongBaoSauCommit(
                saved.getKhachHangId(),
                "BOOKING_CANCELLED",
                "Booking đã được hủy",
                "Booking " + saved.getMaBooking() + " đã được hủy.",
                "BOOKING_CANCELLED:" + saved.getId()
        );
        guiThongBaoChoNhaCungCapSauCommit(
                saved,
                "PROVIDER_BOOKING_CANCELLED",
                "Đơn đặt dịch vụ đã bị hủy",
                "Booking " + saved.getMaBooking() + " đã bị khách hàng hủy.",
                "PROVIDER_BOOKING_CANCELLED:" + saved.getId()
        );

        return taoResponse(saved);
    }

    @Transactional
    public BookingResponseDTO hetHan(
            Long bookingId,
            String authorization
    ) {

        Booking booking =
                timBooking(
                        bookingId
                );

        if (booking.getTrangThai()
                != TrangThaiBooking.PENDING_PAYMENT) {

            throw new RuntimeException(
                    "Booking không thể chuyển sang EXPIRED"
            );
        }

        giaiPhongTatCaHold(
                booking,
                authorization
        );

        if (booking.getUuDaiId() != null) {
            giaiPhongUuDai(booking.getId());
        }

        booking.setTrangThai(
                TrangThaiBooking.EXPIRED
        );

        return taoResponse(
                bookingRepository.save(
                        booking
                )
        );
    }

    // Scheduled expiry: do not depend on a customer opening their booking page.
    @Transactional
    public void hetHanTuDong(Long bookingId) {
        Booking booking = timBooking(bookingId);
        if (booking.getTrangThai() != TrangThaiBooking.PENDING_PAYMENT
                || booking.getHetHanThanhToan() == null
                || booking.getHetHanThanhToan().isAfter(LocalDateTime.now())) return;

        // Release all service-specific inventory before marking expired.
        giaiPhongTatCaHoldNoiBo(booking);
        if (booking.getUuDaiId() != null) giaiPhongUuDai(booking.getId());
        booking.setTrangThai(TrangThaiBooking.EXPIRED);
        Booking saved = bookingRepository.save(booking);
        guiThongBaoSauCommit(saved.getKhachHangId(), "BOOKING_EXPIRED",
                "Đơn đã hết hạn thanh toán",
                "Đơn " + saved.getMaBooking() + " đã hết hạn thanh toán và bị hủy.",
                "BOOKING_EXPIRED:" + saved.getId());
        guiThongBaoChoNhaCungCapSauCommit(saved, "BOOKING_EXPIRED",
                "Đơn chưa thanh toán đã hết hạn",
                "Đơn " + saved.getMaBooking() + " đã hủy do hết hạn thanh toán; chỗ được giải phóng.",
                "BOOKING_EXPIRED:" + saved.getId());
    }

    // The customer reported a transfer, but the provider did not confirm in time.
    // Release the seat/room/ticket, and flag payment for reconciliation.
    // Never announce a refund until an actual refund is confirmed.
    @Transactional
    public void hetHanXacNhanNhaCungCap(Long bookingId) {
        Booking booking = timBooking(bookingId);
        if (booking.getTrangThai() != TrangThaiBooking.PAYMENT_RECEIVED
                || booking.getHetHanThanhToan() == null
                || booking.getHetHanThanhToan().isAfter(LocalDateTime.now())) return;

        // Do not release inventory unless Payment Service has recorded the
        // pending reconciliation; a failed cross-service call is retried.
        restClient.put()
                .uri(paymentUrl + "/api/payments/internal/bookings/" + booking.getId() + "/provider-timeout")
                .header("X-Internal-Token", bookingInternalToken)
                .retrieve().toBodilessEntity();
        giaiPhongTatCaHoldNoiBo(booking);
        if (booking.getUuDaiId() != null) giaiPhongUuDai(booking.getId());
        booking.setTrangThai(TrangThaiBooking.CANCELLED);
        Booking saved = bookingRepository.save(booking);
        guiThongBaoSauCommit(saved.getKhachHangId(), "PAYMENT_TIMEOUT_REFUNDED",
                "Đơn đã hủy và hoàn tiền mô phỏng",
                "Đơn " + saved.getMaBooking() + " đã bị hủy do quá thời gian xác nhận thanh toán. "
                        + "Hệ thống đã ghi nhận hoàn tiền mô phỏng và giải phóng chỗ.",
                "PAYMENT_RECONCILIATION:" + saved.getId());
        guiThongBaoChoNhaCungCapSauCommit(saved, "PAYMENT_TIMEOUT_REFUNDED",
                "Đơn quá hạn xác nhận đã bị hủy",
                "Đơn " + saved.getMaBooking() + " đã hết hạn; hệ thống hoàn tiền mô phỏng và giải phóng chỗ.",
                "PAYMENT_RECONCILIATION:" + saved.getId());
    }

    // =========================================================
    // NOTIFICATION SERVICE
    // =========================================================

    private void guiThongBaoChoNhaCungCapSauCommit(
            Booking booking,
            String type,
            String title,
            String message,
            String eventPrefix
    ) {
        if (booking == null || booking.getDanhSachItem() == null) return;
        booking.getDanhSachItem().stream()
                .map(BookingItem::getNhaCungCapId)
                .filter(Objects::nonNull)
                .distinct()
                .forEach(providerId -> guiThongBaoSauCommit(
                        providerId, type, title, message, eventPrefix + ":" + providerId
                ));
    }

    private void guiThongBaoSauCommit(
            Long userId,
            String type,
            String title,
            String message,
            String eventId
    ) {
        Runnable action = () -> {
            try {
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("userId", userId);
                body.put("title", title);
                body.put("message", message);
                body.put("type", type);
                body.put("eventId", eventId);

                restClient.post()
                        .uri(notificationUrl + "/api/notifications/internal")
                        .header("X-Internal-Token", notificationInternalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .toBodilessEntity();
            } catch (Exception e) {
                // Notification không được làm rollback nghiệp vụ Booking, nhưng phải có log để truy vết.
                log.warn("Không gửi được notification userId={}, type={}, eventId={}: {}",
                        userId, type, eventId, e.getMessage());
            }
        };

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            action.run();
                        }
                    }
            );
        } else {
            action.run();
        }
    }

    // =========================================================
    // HTTP - CUSTOMER JWT
    // =========================================================

    @SuppressWarnings("unchecked")
    private Map<?, ?> get(
            String url,
            String authorization
    ) {

        return restClient
                .get()
                .uri(url)
                .header(
                        HttpHeaders.AUTHORIZATION,
                        authorization
                )
                .retrieve()
                .body(
                        Map.class
                );
    }

    private void post(
            String url,
            Object body,
            String authorization
    ) {

        restClient
                .post()
                .uri(url)
                .header(
                        HttpHeaders.AUTHORIZATION,
                        authorization
                )
                .contentType(
                        MediaType.APPLICATION_JSON
                )
                .body(
                        body
                )
                .retrieve()
                .toBodilessEntity();
    }

    private void put(
            String url,
            String authorization
    ) {

        restClient
                .put()
                .uri(url)
                .header(
                        HttpHeaders.AUTHORIZATION,
                        authorization
                )
                .retrieve()
                .toBodilessEntity();
    }

    // =========================================================
    // HTTP - INTERNAL
    // =========================================================

    @SuppressWarnings("unchecked")
    private Map<?, ?> postPromotion(String url, Object body) {
        return restClient.post()
                .uri(url)
                .header("X-Internal-Token", promotionInternalToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);
    }

    private void postPromotionNoBody(String url) {
        restClient.post()
                .uri(url)
                .header("X-Internal-Token", promotionInternalToken)
                .retrieve()
                .toBodilessEntity();
    }

    private void putInternal(
            String url
    ) {

        restClient
                .put()
                .uri(
                        url
                )
                .header(
                        "X-Internal-Token",
                        inventoryInternalToken
                )
                .retrieve()
                .toBodilessEntity();
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private Booking timBooking(
            Long id
    ) {

        return bookingRepository
                .findById(
                        id
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy booking"
                        )
                );
    }

    private void kiemTraInternalToken(
            String token
    ) {

        if (token == null
                || token.isBlank()
                || !bookingInternalToken.equals(
                token
        )) {

            throw new SecurityException(
                    "Internal token không hợp lệ"
            );
        }
    }

    private void kiemTraQuyen(
            Booking booking,
            Long userId,
            String role
    ) {

        if ("ADMIN".equals(
                role
        )) {

            return;
        }

        if ("CUSTOMER".equals(
                role
        )
                && booking
                .getKhachHangId()
                .equals(
                        userId
                )) {

            return;
        }

        if ("PROVIDER".equals(role) && booking.getTrangThai() != TrangThaiBooking.PENDING_PAYMENT
                && booking.getDanhSachItem().stream().anyMatch(item -> userId.equals(item.getNhaCungCapId()))) {
            return;
        }

        throw new RuntimeException(
                "Bạn không có quyền xem booking này"
        );
    }

    private String taoMaBooking() {

        return "TKV-"
                + UUID.randomUUID()
                .toString()
                .substring(
                        0,
                        8
                )
                .toUpperCase();
    }

    private Long toLong(Object value) {
        if (value == null) {
            throw new RuntimeException("Không lấy được ID nhà cung cấp dịch vụ");
        }
        if (value instanceof Number number) return number.longValue();
        return Long.valueOf(value.toString());
    }

    private BigDecimal toBigDecimal(
            Object value
    ) {

        if (value == null) {

            throw new RuntimeException(
                    "Không lấy được giá dịch vụ"
            );
        }

        return new BigDecimal(
                value.toString()
        );
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    private BookingResponseDTO taoResponseChoNhaCungCap(Booking booking, Long providerId) {
        List<BookingItemResponseDTO> items = booking.getDanhSachItem().stream()
                .filter(item -> providerId.equals(item.getNhaCungCapId()))
                .map(item -> new BookingItemResponseDTO(
                        item.getId(), item.getLoaiDichVu(), item.getDichVuId(), item.getNhaCungCapId(),
                        item.getSoLuong(), item.getDonGia(), item.getThanhTien(), item.getNgayBatDau(),
                        item.getNgayKetThuc(), item.getThongTinBoSung()
                ))
                .toList();
        BigDecimal providerTotal = items.stream()
                .map(BookingItemResponseDTO::getThanhTien)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BookingResponseDTO response = new BookingResponseDTO(
                booking.getId(), booking.getMaBooking(), booking.getKhachHangId(), providerTotal,
                null, null, BigDecimal.ZERO, providerTotal, booking.getTrangThai(),
                booking.getHetHanThanhToan(), items
        );
        response.setLyDoHuy(booking.getLyDoHuy());
        response.setLyDoTuChoiHuy(booking.getLyDoTuChoiHuy());
        response.setHanXuLyHuy(booking.getHanXuLyHuy());
        return response;
    }

    private BookingResponseDTO taoResponse(
            Booking booking
    ) {

        List<BookingItemResponseDTO> items =
                booking
                        .getDanhSachItem()
                        .stream()
                        .map(item ->
                                new BookingItemResponseDTO(
                                        item.getId(),
                                        item.getLoaiDichVu(),
                                        item.getDichVuId(),
                                        item.getNhaCungCapId(),
                                        item.getSoLuong(),
                                        item.getDonGia(),
                                        item.getThanhTien(),
                                        item.getNgayBatDau(),
                                        item.getNgayKetThuc(),
                                        item.getThongTinBoSung()
                                )
                        )
                        .toList();

        BookingResponseDTO response = new BookingResponseDTO(
                booking.getId(),
                booking.getMaBooking(),
                booking.getKhachHangId(),
                booking.getTongTienGoc(),
                booking.getUuDaiId(),
                booking.getMaUuDai(),
                booking.getSoTienGiam(),
                booking.getTongTien(),
                booking.getTrangThai(),
                booking.getHetHanThanhToan(),
                items
        );
        response.setLyDoHuy(booking.getLyDoHuy());
        response.setLyDoTuChoiHuy(booking.getLyDoTuChoiHuy());
        response.setHanXuLyHuy(booking.getHanXuLyHuy());
        return response;
    }
}