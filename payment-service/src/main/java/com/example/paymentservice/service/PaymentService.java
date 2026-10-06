package com.example.paymentservice.service;

import com.example.paymentservice.dto.*;
import com.example.paymentservice.entity.*;
import com.example.paymentservice.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final GiaoDichThanhToanRepository giaoDichRepository;
    private final HoanTienRepository hoanTienRepository;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final PayosClient payosClient;

    @Value("${service.booking.url}")
    private String bookingUrl;

    @Value("${service.booking.internal-token}")
    private String bookingInternalToken;

    @Value("${payment.bank.id}")
    private String bankId;

    @Value("${payment.bank.name}")
    private String bankName;

    @Value("${payment.bank.account-number}")
    private String accountNumber;

    @Value("${payment.bank.account-name}")
    private String accountName;

    @Value("${payment.vietqr.base-url}")
    private String vietQrBaseUrl;

    @Value("${payment.vietqr.template}")
    private String vietQrTemplate;

    @Value("${payment.sepay.webhook-secret}")
    private String sePayWebhookSecret;

    @Value("${service.notification.url}")
    private String notificationUrl;

    @Value("${notification.internal-token}")
    private String notificationInternalToken;

    @Value("${paypal.base-url}")
    private String paypalBaseUrl;

    @Value("${paypal.client-id}")
    private String paypalClientId;

    @Value("${paypal.client-secret}")
    private String paypalClientSecret;

    @Value("${paypal.webhook-id}")
    private String paypalWebhookId;

    @Value("${paypal.return-url}")
    private String paypalReturnUrl;

    @Value("${paypal.cancel-url}")
    private String paypalCancelUrl;

    @Value("${paypal.currency:USD}")
    private String paypalCurrency;

    @Value("${paypal.vnd-per-usd:25000}")
    private BigDecimal paypalVndPerUsd;

    public PaymentService(
            PaymentRepository paymentRepository,
            GiaoDichThanhToanRepository giaoDichRepository,
            HoanTienRepository hoanTienRepository,
            ObjectMapper objectMapper,
            PayosClient payosClient
    ) {

        this.paymentRepository =
                paymentRepository;

        this.giaoDichRepository =
                giaoDichRepository;

        this.hoanTienRepository =
                hoanTienRepository;

        this.objectMapper =
                objectMapper;
        this.payosClient = payosClient;

        this.restClient =
                RestClient.create();
    }

    // =========================================================
    // CREATE PAYMENT
    // =========================================================

    @Transactional
    public PaymentResponseDTO taoPayment(
            TaoPaymentRequestDTO request,
            Long customerId,
            String authorization
    ) {

        PhuongThucThanhToan phuongThuc =
                request.getPhuongThuc() == null
                        ? PhuongThucThanhToan.PAYPAL
                        : request.getPhuongThuc();

        if (phuongThuc != PhuongThucThanhToan.PAYPAL && phuongThuc != PhuongThucThanhToan.PAYOS) {
            throw new RuntimeException("Phương thức thanh toán không được hỗ trợ");
        }

        if (request.getIdempotencyKey() != null
                && !request.getIdempotencyKey().isBlank()) {

            Optional<Payment> paymentCu =
                    paymentRepository.findByKhachHangIdAndIdempotencyKey(
                            customerId,
                            request.getIdempotencyKey()
                    );

            if (paymentCu.isPresent()) {
                Payment old = paymentCu.get();

                if (!old.getBookingId().equals(request.getBookingId())) {
                    throw new RuntimeException(
                            "Idempotency-Key đã được sử dụng cho Booking khác"
                    );
                }

                if (old.getPhuongThuc() != phuongThuc) {
                    throw new RuntimeException(
                            "Idempotency-Key đã được sử dụng cho phương thức thanh toán khác"
                    );
                }

                if (old.getTrangThai() == TrangThaiPayment.CANCELLED) {
                    throw new RuntimeException("Giao dịch trước đã hủy. Hãy tạo lần thanh toán mới với mã yêu cầu mới nếu Booking còn hạn.");
                }
                return taoPaymentResponse(old);
            }
        }

        /*
         * Số tiền luôn lấy từ Booking Service.
         * Frontend không được tự truyền amount.
         */
        chuanBiBookingThanhToan(request.getBookingId());

        Map<?, ?> booking = layBooking(request.getBookingId(), authorization);

        Long bookingCustomerId = toLong(booking.get("khachHangId"));
        if (!customerId.equals(bookingCustomerId)) {
            throw new RuntimeException("Booking không thuộc khách hàng hiện tại");
        }

        String bookingStatus = String.valueOf(booking.get("trangThai"));
        if (!"PENDING_PAYMENT".equals(bookingStatus)) {
            throw new RuntimeException("Booking không ở trạng thái PENDING_PAYMENT");
        }

        String maBooking = String.valueOf(booking.get("maBooking"));
        BigDecimal soTien = toBigDecimal(booking.get("tongTien"));
        if (soTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền Booking phải > 0");
        }

        Optional<Payment> activePayment =
                paymentRepository.findFirstByBookingIdAndTrangThaiOrderByIdDesc(
                        request.getBookingId(),
                        TrangThaiPayment.PENDING
                );

        if (activePayment.isPresent()) {
            Payment old = activePayment.get();
            if (old.getHetHanLuc() == null || old.getHetHanLuc().isAfter(LocalDateTime.now())) {
                if (old.getPhuongThuc() != phuongThuc) {
                    throw new RuntimeException(
                            "Booking đang có một giao dịch thanh toán chưa hoàn tất. Vui lòng hoàn tất hoặc hủy giao dịch hiện tại trước khi đổi phương thức"
                    );
                }
                return taoPaymentResponse(old);
            }
            old.setTrangThai(TrangThaiPayment.CANCELLED);
            paymentRepository.save(old);
        }

        Optional<Payment> pending = Optional.empty();


        Payment payment = new Payment();
        payment.setMaThanhToan(taoMaPayment());
        payment.setBookingId(request.getBookingId());
        payment.setMaBooking(maBooking);
        payment.setKhachHangId(customerId);
        payment.setSoTien(soTien);
        payment.setPhuongThuc(phuongThuc);
        payment.setTrangThai(TrangThaiPayment.PENDING);
        payment.setIdempotencyKey(request.getIdempotencyKey());
        payment.setHetHanLuc(parseDateTime(booking.get("hetHanThanhToan")));

        if (phuongThuc == PhuongThucThanhToan.QR_BANK_TRANSFER) {
            payment.setMaNganHang(bankId);
            payment.setSoTaiKhoan(accountNumber);
            payment.setTenTaiKhoan(accountName);
            payment.setNoiDungChuyenKhoan(maBooking);
            payment.setQrUrl(taoQrUrl(maBooking, soTien));
            return taoPaymentResponse(paymentRepository.save(payment));
        }

        if (phuongThuc == PhuongThucThanhToan.PAYPAL) {
            kiemTraCauHinhPaypal();
            payment.setPaypalCurrency(paypalCurrency.toUpperCase(Locale.ROOT));
            payment.setPaypalAmount(doiVndSangPaypal(soTien));
            payment = paymentRepository.save(payment);
            taoPaypalOrder(payment);
            return taoPaymentResponse(paymentRepository.save(payment));
        }

        if (phuongThuc == PhuongThucThanhToan.PAYOS) {
            payment = paymentRepository.save(payment);
            payosClient.create(payment);
            return taoPaymentResponse(paymentRepository.save(payment));
        }

        throw new RuntimeException("Phương thức thanh toán chưa được hỗ trợ");
    }

    // =========================================================
    // QR
    // =========================================================

    public QrResponseDTO taoQr(
            Long paymentId,
            Long userId,
            String role
    ) {

        Payment payment =
                timPayment(
                        paymentId
                );

        kiemTraQuyenXem(
                payment,
                userId,
                role
        );

        if (payment.getTrangThai()
                != TrangThaiPayment.PENDING) {

            throw new RuntimeException(
                    "Chỉ Payment PENDING mới được tạo QR"
            );
        }

        if (payment.getPhuongThuc() == PhuongThucThanhToan.PAYOS) payosClient.cancel(payment);

        if (payment.getHetHanLuc() != null
                && payment
                .getHetHanLuc()
                .isBefore(
                        LocalDateTime.now()
                )) {

            throw new RuntimeException(
                    "Mã QR đã hết hạn"
            );
        }

        if (payment.getQrUrl() == null
                || payment
                .getQrUrl()
                .isBlank()) {

            payment.setQrUrl(
                    taoQrUrl(
                            payment.getMaBooking(),
                            payment.getSoTien()
                    )
            );

            paymentRepository.save(
                    payment
            );
        }

        return new QrResponseDTO(
                payment.getId(),
                payment.getMaThanhToan(),
                payment.getMaBooking(),
                bankName,
                payment.getSoTaiKhoan(),
                payment.getTenTaiKhoan(),
                payment.getSoTien(),
                payment.getNoiDungChuyenKhoan(),
                payment.getQrUrl(),
                payment.getHetHanLuc()
        );
    }

    // =========================================================
    // SEPAY WEBHOOK
    // =========================================================

    @Transactional
    public WebhookResponseDTO xuLyWebhook(
            SePayWebhookDTO request,
            String webhookSecret
    ) {

        if (webhookSecret == null
                || !sePayWebhookSecret.equals(
                webhookSecret
        )) {

            throw new RuntimeException(
                    "Webhook secret không hợp lệ"
            );
        }

        String transactionCode =
                request.getTransactionCode() == null
                        ? null
                        : request
                        .getTransactionCode()
                        .trim();

        if (transactionCode == null
                || transactionCode.isBlank()) {

            throw new RuntimeException(
                    "transactionCode không được để trống"
            );
        }

        if (request.getAmount() == null
                || request
                .getAmount()
                .compareTo(
                        BigDecimal.ZERO
                ) <= 0) {

            throw new RuntimeException(
                    "Số tiền giao dịch không hợp lệ"
            );
        }

        /*
         * SePay có thể gửi lại một transaction
         * nhiều lần.
         */
        if (giaoDichRepository
                .existsByTransactionCode(
                        transactionCode
                )) {

            return new WebhookResponseDTO(
                    true,
                    true,
                    "Giao dịch đã được xử lý trước đó",
                    null
            );
        }

        String content =
                request.getContent() == null
                        ? ""
                        : request
                        .getContent()
                        .trim();

        Optional<Payment> paymentOptional =
                timPaymentTheoNoiDung(
                        content
                );

        /*
         * Không tìm được Payment:
         * vẫn lưu transaction để đối soát.
         */
        if (paymentOptional.isEmpty()) {

            luuGiaoDich(
                    null,
                    request,
                    null,
                    KetQuaDoiSoat.PAYMENT_NOT_FOUND
            );

            return new WebhookResponseDTO(
                    false,
                    false,
                    "Không xác định được Payment từ nội dung chuyển khoản",
                    null
            );
        }

        Payment payment =
                paymentOptional.get();

        /*
         * Payment đã thành công:
         * không được xử lý tiền lần thứ hai.
         */
        if (payment.getTrangThai()
                == TrangThaiPayment.SUCCESS
                || payment.getTrangThai()
                == TrangThaiPayment.REFUND_PENDING
                || payment.getTrangThai()
                == TrangThaiPayment.REFUNDED) {

            luuGiaoDich(
                    payment,
                    request,
                    payment.getMaBooking(),
                    KetQuaDoiSoat.PAYMENT_ALREADY_SUCCESS
            );

            return new WebhookResponseDTO(
                    false,
                    false,
                    "Payment đã được thanh toán trước đó",
                    payment.getId()
            );
        }

        /*
         * Payment hết thời gian giữ chỗ:
         * vẫn lưu giao dịch nhưng không SUCCESS.
         */
        if (payment.getHetHanLuc() != null
                && payment
                .getHetHanLuc()
                .isBefore(
                        LocalDateTime.now()
                )) {

            payment.setTrangThai(
                    TrangThaiPayment.CANCELLED
            );

            paymentRepository.save(
                    payment
            );

            luuGiaoDich(
                    payment,
                    request,
                    payment.getMaBooking(),
                    KetQuaDoiSoat.BOOKING_EXPIRED
            );

            guiThongBaoSauCommit(
                    payment.getKhachHangId(),
                    "PAYMENT_FAILED",
                    "Thanh toán không thành công",
                    "Booking " + payment.getMaBooking() + " đã hết thời gian thanh toán. Giao dịch cần được đối soát.",
                    "PAYMENT_FAILED:EXPIRED:" + payment.getId() + ":" + transactionCode
            );

            return new WebhookResponseDTO(
                    false,
                    false,
                    "Booking/Payment đã hết thời gian giữ chỗ, giao dịch cần đối soát",
                    payment.getId()
            );
        }

        /*
         * Sai tiền:
         * không SUCCESS.
         */
        if (request
                .getAmount()
                .compareTo(
                        payment.getSoTien()
                ) != 0) {

            luuGiaoDich(
                    payment,
                    request,
                    payment.getMaBooking(),
                    KetQuaDoiSoat.AMOUNT_MISMATCH
            );

            guiThongBaoSauCommit(
                    payment.getKhachHangId(),
                    "PAYMENT_FAILED",
                    "Thanh toán chưa được xác nhận",
                    "Số tiền chuyển khoản cho Booking " + payment.getMaBooking() + " không khớp. Giao dịch cần được đối soát.",
                    "PAYMENT_FAILED:AMOUNT:" + payment.getId() + ":" + transactionCode
            );

            return new WebhookResponseDTO(
                    false,
                    false,
                    "Số tiền giao dịch không khớp Payment",
                    payment.getId()
            );
        }

        /*
         * Đối soát thành công.
         */
        luuGiaoDich(
                payment,
                request,
                payment.getMaBooking(),
                KetQuaDoiSoat.MATCHED
        );

        payment.setTransactionCode(
                transactionCode
        );

        payment.setTrangThai(
                TrangThaiPayment.SUCCESS
        );

        payment.setThanhToanLuc(
                request.getTransactionTime() != null
                        ? request.getTransactionTime()
                        : LocalDateTime.now()
        );

        paymentRepository.save(
                payment
        );

        guiThongBaoSauCommit(
                payment.getKhachHangId(),
                "PAYMENT_SUCCESS",
                "Thanh toán thành công",
                "Thanh toán cho Booking " + payment.getMaBooking() + " đã được xác nhận.",
                "PAYMENT_SUCCESS:" + payment.getId() + ":" + transactionCode
        );

        /*
         * Payment đã SUCCESS.
         *
         * Gọi Booking bằng X-Internal-Token.
         * Nếu Booking tạm thời lỗi thì KHÔNG rollback
         * giao dịch ngân hàng đã đối soát thành công.
         *
         * Bước tiếp theo sẽ hoàn thiện endpoint
         * internal ở Booking Service.
         */
        try {

            thongBaoBookingThanhCong(
                    payment.getBookingId()
            );

        } catch (Exception ignored) {

            /*
             * Payment vẫn giữ SUCCESS.
             * Việc đồng bộ Booking có thể retry
             * ở tầng tích hợp sau.
             */
        }

        return new WebhookResponseDTO(
                true,
                false,
                "Thanh toán đã được đối chiếu thành công",
                payment.getId()
        );
    }

    // =========================================================
    // PAYPAL
    // =========================================================

    @Transactional
    public PaymentResponseDTO capturePaypalOrder(
            String orderId,
            Long userId,
            String role
    ) {
        if (orderId == null || orderId.isBlank()) {
            throw new RuntimeException("PayPal orderId không hợp lệ");
        }

        Payment payment = paymentRepository
                .findByPaypalOrderId(orderId.trim())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Payment PayPal"));

        kiemTraQuyenXem(payment, userId, role);

        if (payment.getTrangThai() == TrangThaiPayment.SUCCESS) {
            return taoPaymentResponse(payment);
        }

        if (payment.getTrangThai() != TrangThaiPayment.PENDING) {
            throw new RuntimeException("Payment PayPal không còn ở trạng thái PENDING");
        }

        kiemTraCauHinhPaypal();
        String accessToken = layPaypalAccessToken();

        JsonNode response;
        try {
            response = restClient
                    .post()
                    .uri(paypalBaseUrl + "/v2/checkout/orders/" + orderId.trim() + "/capture")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header("PayPal-Request-Id", "CAPTURE-" + payment.getMaThanhToan())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{}")
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception e) {
            throw new RuntimeException("Không capture được PayPal Order: " + e.getMessage());
        }

        if (response == null || !"COMPLETED".equalsIgnoreCase(response.path("status").asText())) {
            throw new RuntimeException("PayPal chưa xác nhận thanh toán COMPLETED");
        }

        JsonNode capture = response
                .path("purchase_units")
                .path(0)
                .path("payments")
                .path("captures")
                .path(0);

        String captureId = capture.path("id").asText(null);
        String currency = capture.path("amount").path("currency_code").asText(null);
        BigDecimal amount = new BigDecimal(capture.path("amount").path("value").asText("0"));

        xacThucSoTienPaypal(payment, currency, amount);
        danhDauPaypalThanhCong(payment, captureId);

        return taoPaymentResponse(payment);
    }

    @Transactional
    public Map<String, Object> xuLyPaypalWebhook(
            String rawBody,
            HttpHeaders headers
    ) {
        if (rawBody == null || rawBody.isBlank()) {
            throw new RuntimeException("PayPal webhook rỗng");
        }

        if (!xacThucPaypalWebhook(rawBody, headers)) {
            throw new RuntimeException("Chữ ký PayPal webhook không hợp lệ");
        }

        try {
            JsonNode event = objectMapper.readTree(rawBody);
            String eventType = event.path("event_type").asText("");
            JsonNode resource = event.path("resource");
            String orderId = resource.path("supplementary_data")
                    .path("related_ids")
                    .path("order_id")
                    .asText(null);

            if (orderId == null || orderId.isBlank()) {
                return Map.of("received", true, "handled", false, "eventType", eventType);
            }

            Optional<Payment> optional = paymentRepository.findByPaypalOrderId(orderId);
            if (optional.isEmpty()) {
                return Map.of("received", true, "handled", false, "eventType", eventType);
            }

            Payment payment = optional.get();

            if ("PAYMENT.CAPTURE.COMPLETED".equals(eventType)) {
                String captureId = resource.path("id").asText(null);
                String currency = resource.path("amount").path("currency_code").asText(null);
                BigDecimal amount = new BigDecimal(resource.path("amount").path("value").asText("0"));
                xacThucSoTienPaypal(payment, currency, amount);
                danhDauPaypalThanhCong(payment, captureId);
                return Map.of("received", true, "handled", true, "eventType", eventType);
            }

            if ("PAYMENT.CAPTURE.DENIED".equals(eventType)
                    && payment.getTrangThai() == TrangThaiPayment.PENDING) {
                payment.setTrangThai(TrangThaiPayment.FAILED);
                paymentRepository.save(payment);
                guiThongBaoSauCommit(
                        payment.getKhachHangId(),
                        "PAYMENT_FAILED",
                        "Thanh toán PayPal không thành công",
                        "PayPal từ chối thanh toán cho Booking " + payment.getMaBooking() + ".",
                        "PAYPAL_FAILED:" + payment.getId() + ":" + event.path("id").asText("")
                );
                return Map.of("received", true, "handled", true, "eventType", eventType);
            }

            return Map.of("received", true, "handled", false, "eventType", eventType);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Không xử lý được PayPal webhook: " + e.getMessage());
        }
    }

    private void taoPaypalOrder(Payment payment) {
        String accessToken = layPaypalAccessToken();
        String returnUrl = themQuery(paypalReturnUrl,
                "bookingId=" + payment.getBookingId() + "&paypal=return");
        String cancelUrl = themQuery(paypalCancelUrl,
                "bookingId=" + payment.getBookingId() + "&paypal=cancel");

        Map<String, Object> experienceContext = new LinkedHashMap<>();
        experienceContext.put("payment_method_preference", "IMMEDIATE_PAYMENT_REQUIRED");
        experienceContext.put("landing_page", "LOGIN");
        experienceContext.put("shipping_preference", "NO_SHIPPING");
        experienceContext.put("user_action", "PAY_NOW");
        experienceContext.put("return_url", returnUrl);
        experienceContext.put("cancel_url", cancelUrl);

        Map<String, Object> paypal = new LinkedHashMap<>();
        paypal.put("experience_context", experienceContext);

        Map<String, Object> paymentSource = new LinkedHashMap<>();
        paymentSource.put("paypal", paypal);

        Map<String, Object> amount = new LinkedHashMap<>();
        amount.put("currency_code", payment.getPaypalCurrency());
        amount.put("value", payment.getPaypalAmount().setScale(2, RoundingMode.HALF_UP).toPlainString());

        Map<String, Object> unit = new LinkedHashMap<>();
        unit.put("reference_id", payment.getMaThanhToan());
        unit.put("custom_id", payment.getMaBooking());
        unit.put("description", "TAKIVIVU Booking " + payment.getMaBooking());
        unit.put("amount", amount);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("intent", "CAPTURE");
        body.put("purchase_units", List.of(unit));
        body.put("payment_source", paymentSource);

        JsonNode response;
        try {
            response = restClient
                    .post()
                    .uri(paypalBaseUrl + "/v2/checkout/orders")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header("PayPal-Request-Id", "CREATE-" + payment.getMaThanhToan())
                    .header("Prefer", "return=representation")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception e) {
            throw new RuntimeException("Không tạo được PayPal Order: " + e.getMessage());
        }

        if (response == null || response.path("id").asText("").isBlank()) {
            throw new RuntimeException("PayPal không trả về Order ID");
        }

        payment.setPaypalOrderId(response.path("id").asText());
        String approvalUrl = null;
        for (JsonNode link : response.path("links")) {
            String rel = link.path("rel").asText();
            if ("payer-action".equals(rel) || "approve".equals(rel)) {
                approvalUrl = link.path("href").asText(null);
                break;
            }
        }
        if (approvalUrl == null || approvalUrl.isBlank()) {
            throw new RuntimeException("PayPal không trả về payer-action URL");
        }
        payment.setPaypalApprovalUrl(approvalUrl);
    }

    private String layPaypalAccessToken() {
        kiemTraCauHinhPaypal();
        String basic = Base64.getEncoder().encodeToString(
                (paypalClientId + ":" + paypalClientSecret).getBytes(StandardCharsets.UTF_8)
        );

        try {
            JsonNode response = restClient
                    .post()
                    .uri(paypalBaseUrl + "/v1/oauth2/token")
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body("grant_type=client_credentials")
                    .retrieve()
                    .body(JsonNode.class);

            String token = response == null ? null : response.path("access_token").asText(null);
            if (token == null || token.isBlank()) {
                throw new RuntimeException("PayPal không trả về access_token");
            }
            return token;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Không lấy được PayPal access token: " + e.getMessage());
        }
    }

    private boolean xacThucPaypalWebhook(String rawBody, HttpHeaders headers) {
        if (paypalWebhookId == null || paypalWebhookId.isBlank()) {
            throw new RuntimeException("Chưa cấu hình PAYPAL_WEBHOOK_ID");
        }

        String transmissionId = headers.getFirst("PAYPAL-TRANSMISSION-ID");
        String transmissionTime = headers.getFirst("PAYPAL-TRANSMISSION-TIME");
        String certUrl = headers.getFirst("PAYPAL-CERT-URL");
        String authAlgo = headers.getFirst("PAYPAL-AUTH-ALGO");
        String transmissionSig = headers.getFirst("PAYPAL-TRANSMISSION-SIG");

        if (Stream.of(transmissionId, transmissionTime, certUrl, authAlgo, transmissionSig)
                .anyMatch(v -> v == null || v.isBlank())) {
            return false;
        }

        try {
            String accessToken = layPaypalAccessToken();
            String verifyBody = "{" +
                    "\"transmission_id\":" + objectMapper.writeValueAsString(transmissionId) + "," +
                    "\"transmission_time\":" + objectMapper.writeValueAsString(transmissionTime) + "," +
                    "\"cert_url\":" + objectMapper.writeValueAsString(certUrl) + "," +
                    "\"auth_algo\":" + objectMapper.writeValueAsString(authAlgo) + "," +
                    "\"transmission_sig\":" + objectMapper.writeValueAsString(transmissionSig) + "," +
                    "\"webhook_id\":" + objectMapper.writeValueAsString(paypalWebhookId) + "," +
                    "\"webhook_event\":" + rawBody +
                    "}";

            JsonNode response = restClient
                    .post()
                    .uri(paypalBaseUrl + "/v1/notifications/verify-webhook-signature")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(verifyBody)
                    .retrieve()
                    .body(JsonNode.class);

            return response != null
                    && "SUCCESS".equalsIgnoreCase(response.path("verification_status").asText());
        } catch (Exception e) {
            throw new RuntimeException("Không xác thực được PayPal webhook: " + e.getMessage());
        }
    }

    private void xacThucSoTienPaypal(Payment payment, String currency, BigDecimal amount) {
        if (currency == null
                || !currency.equalsIgnoreCase(payment.getPaypalCurrency())) {
            throw new RuntimeException("Currency PayPal không khớp Payment");
        }
        if (amount == null || payment.getPaypalAmount() == null
                || amount.compareTo(payment.getPaypalAmount()) != 0) {
            throw new RuntimeException("Số tiền PayPal không khớp Payment");
        }
    }

    private void danhDauPaypalThanhCong(Payment payment, String captureId) {
        if (payment.getTrangThai() == TrangThaiPayment.SUCCESS) {
            return;
        }

        payment.setPaypalCaptureId(captureId);
        payment.setTransactionCode(captureId);
        payment.setTrangThai(TrangThaiPayment.SUCCESS);
        payment.setThanhToanLuc(LocalDateTime.now());
        paymentRepository.save(payment);

        guiThongBaoSauCommit(
                payment.getKhachHangId(),
                "PAYMENT_SUCCESS",
                "Thanh toán PayPal thành công",
                "Thanh toán PayPal cho Booking " + payment.getMaBooking() + " đã được xác nhận.",
                "PAYPAL_SUCCESS:" + payment.getId() + ":" + (captureId == null ? "" : captureId)
        );

        try {
            thongBaoBookingThanhCong(payment.getBookingId());
        } catch (Exception ignored) {
            // Payment đã SUCCESS; Booking có thể retry đồng bộ sau.
        }
    }

    @Transactional
    public Map<String, Object> xuLyPayosWebhook(JsonNode webhook) {
        JsonNode data = payosClient.verifiedData(webhook);
        // PayOS sends a signed sample when the webhook URL is registered.
        if (data.path("orderCode").asLong() == 123 && paymentRepository.findById(123L).isEmpty())
            return Map.of("success", true);
        Payment payment = paymentRepository.findById(data.path("orderCode").asLong())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thanh toán PayOS"));
        if (payment.getPhuongThuc() != PhuongThucThanhToan.PAYOS)
            throw new IllegalArgumentException("Phương thức thanh toán không khớp");
        if (payment.getSoTien().compareTo(new BigDecimal(data.path("amount").asText("0"))) != 0
                || !"VND".equals(data.path("currency").asText()))
            throw new IllegalArgumentException("Số tiền hoặc tiền tệ PayOS không khớp");
        if (payment.getPayosPaymentLinkId() == null || !payment.getPayosPaymentLinkId().equals(data.path("paymentLinkId").asText()))
            throw new IllegalArgumentException("Liên kết thanh toán PayOS không khớp");
        if (!webhook.path("success").asBoolean() || !"00".equals(data.path("code").asText()))
            return Map.of("success", true);
        if (payment.getTrangThai() == TrangThaiPayment.SUCCESS) return Map.of("success", true);
        if (payment.getTrangThai() != TrangThaiPayment.PENDING)
            throw new IllegalStateException("Thanh toán PayOS không còn chờ xử lý");
        String reference = data.path("reference").asText();
        payment.setTransactionCode(reference);
        payment.setTrangThai(TrangThaiPayment.SUCCESS);
        payment.setThanhToanLuc(LocalDateTime.now());
        paymentRepository.save(payment);
        guiThongBaoSauCommit(payment.getKhachHangId(), "PAYMENT_SUCCESS", "Thanh toán PayOS thành công",
                "Thanh toán PayOS cho Booking " + payment.getMaBooking() + " đã được xác nhận.",
                "PAYOS_SUCCESS:" + payment.getId() + ":" + reference);
        try { thongBaoBookingThanhCong(payment.getBookingId()); } catch (Exception ignored) { }
        return Map.of("success", true);
    }

    private BigDecimal doiVndSangPaypal(BigDecimal vnd) {
        if (paypalVndPerUsd == null || paypalVndPerUsd.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("PAYPAL_VND_PER_USD phải > 0");
        }
        return vnd.divide(paypalVndPerUsd, 2, RoundingMode.HALF_UP);
    }

    private String themQuery(String baseUrl, String query) {
        return baseUrl + (baseUrl.contains("?") ? "&" : "?") + query;
    }

    private void kiemTraCauHinhPaypal() {
        if (paypalClientId == null || paypalClientId.isBlank()
                || paypalClientSecret == null || paypalClientSecret.isBlank()) {
            throw new RuntimeException("Chưa cấu hình PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET");
        }
    }

    // =========================================================
    // READ PAYMENT
    // =========================================================

    public PaymentResponseDTO chiTiet(
            Long paymentId,
            Long userId,
            String role
    ) {

        Payment payment =
                timPayment(
                        paymentId
                );

        kiemTraQuyenXem(
                payment,
                userId,
                role
        );

        return taoPaymentResponse(
                payment
        );
    }

    public PaymentResponseDTO chiTietTheoMaBooking(
            String bookingCode,
            Long userId,
            String role
    ) {

        if (bookingCode == null
                || bookingCode.isBlank()) {

            throw new RuntimeException(
                    "Mã Booking không hợp lệ"
            );
        }

        Payment payment =
                paymentRepository
                        .findFirstByMaBookingOrderByIdDesc(
                                bookingCode.trim()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy Payment của Booking"
                                )
                        );

        kiemTraQuyenXem(
                payment,
                userId,
                role
        );

        return taoPaymentResponse(
                payment
        );
    }

    public PaymentResponseDTO trangThai(
            Long paymentId,
            Long userId,
            String role
    ) {

        return chiTiet(
                paymentId,
                userId,
                role
        );
    }

    public List<PaymentResponseDTO>
    thanhToanCuaToi(
            Long customerId
    ) {

        return paymentRepository
                .findByKhachHangIdOrderByIdDesc(
                        customerId
                )
                .stream()
                .map(
                        this::taoPaymentResponse
                )
                .toList();
    }

    // =========================================================
    // ADMIN LIST
    // =========================================================

    public List<PaymentResponseDTO> tatCaPaymentChoAdmin(
            String role
    ) {

        if (!"ADMIN".equals(role)) {
            throw new RuntimeException(
                    "Chỉ ADMIN được xem toàn bộ giao dịch thanh toán"
            );
        }

        return paymentRepository
                .findAllByOrderByIdDesc()
                .stream()
                .map(this::taoPaymentResponse)
                .toList();
    }

    public List<RefundResponseDTO> tatCaHoanTienChoAdmin(
            String role
    ) {

        if (!"ADMIN".equals(role)) {
            throw new RuntimeException(
                    "Chỉ ADMIN được xem danh sách yêu cầu hoàn tiền"
            );
        }

        return hoanTienRepository
                .findAllByOrderByIdDesc()
                .stream()
                .map(this::taoRefundResponse)
                .toList();
    }

    // Booking Service only: authenticated by a shared internal token.
    @Transactional
    public void providerConfirmTransfer(Long bookingId, String token) {
        verifyBookingInternalToken(token);
        Payment payment = paymentRepository
                .findFirstByBookingIdAndTrangThaiOrderByIdDesc(bookingId, TrangThaiPayment.PENDING)
                .orElseGet(() -> paymentRepository
                        .findFirstByBookingIdAndTrangThaiOrderByIdDesc(bookingId, TrangThaiPayment.SUCCESS)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch cần xác nhận")));
        if (payment.getPhuongThuc() != PhuongThucThanhToan.QR_BANK_TRANSFER)
            throw new RuntimeException("Chỉ hỗ trợ xác nhận thủ công cho chuyển khoản QR");
        if (payment.getTrangThai() == TrangThaiPayment.SUCCESS) return;
        payment.setTrangThai(TrangThaiPayment.SUCCESS);
        payment.setThanhToanLuc(LocalDateTime.now());
        paymentRepository.save(payment);
    }

    // The system is a classroom simulation: no bank transfer or real refund.
    // Idempotent for Booking retries after service-to-service interruptions.
    @Transactional
    public void mockRefundByBooking(Long bookingId, String token) {
        verifyBookingInternalToken(token);
        Payment payment = paymentRepository.findFirstByBookingIdAndTrangThaiOrderByIdDesc(
                bookingId, TrangThaiPayment.SUCCESS)
                .orElseGet(() -> paymentRepository.findFirstByBookingIdAndTrangThaiOrderByIdDesc(
                        bookingId, TrangThaiPayment.RECONCILIATION_REQUIRED)
                        .orElseGet(() -> paymentRepository.findFirstByBookingIdAndTrangThaiOrderByIdDesc(
                                bookingId, TrangThaiPayment.PENDING)
                                .orElseGet(() -> paymentRepository.findFirstByBookingIdAndTrangThaiOrderByIdDesc(
                                        bookingId, TrangThaiPayment.REFUNDED).orElseThrow(
                                        () -> new RuntimeException("Không có Payment để hoàn tiền mô phỏng")))));
        if (payment.getTrangThai() == TrangThaiPayment.REFUNDED) return;
        if (payment.getPhuongThuc() != PhuongThucThanhToan.QR_BANK_TRANSFER)
            throw new RuntimeException("Hoàn tiền mô phỏng chỉ áp dụng QR; PayPal cần quy trình riêng");
        HoanTien refund = new HoanTien();
        refund.setMaHoanTien(taoMaRefund());
        refund.setPayment(payment);
        refund.setBookingId(bookingId);
        refund.setSoTien(payment.getSoTien());
        refund.setLyDo("Hoàn tiền MÔ PHỎNG, không chuyển khoản thực tế");
        refund.setTrangThai(TrangThaiHoanTien.SUCCESS);
        refund.setRefundTransactionCode("MOCK-" + java.util.UUID.randomUUID());
        refund.setHoanTienLuc(LocalDateTime.now());
        hoanTienRepository.save(refund);
        payment.setTrangThai(TrangThaiPayment.REFUNDED);
        paymentRepository.save(payment);
    }

    // After checking the bank statement, admin can mark a late transfer as
    // received. This does NOT revive the expired booking or issue a ticket.
    // Existing refund API then creates the refund request; a separate bank
    // transfer and confirmation are still required.
    @Transactional
    public PaymentResponseDTO reconcileLateTransfer(Long paymentId, String role) {
        if (!"ADMIN".equals(role)) throw new RuntimeException("Chỉ ADMIN được đối soát khoản chuyển đến muộn");
        Payment payment = timPayment(paymentId);
        if (payment.getTrangThai() != TrangThaiPayment.RECONCILIATION_REQUIRED)
            throw new RuntimeException("Payment không chờ đối soát");
        payment.setTrangThai(TrangThaiPayment.SUCCESS);
        payment.setThanhToanLuc(LocalDateTime.now());
        // Deliberately do NOT call Booking payment-success: inventory is released.
        return taoPaymentResponse(paymentRepository.save(payment));
    }

    @Transactional
    public void providerConfirmationTimeout(Long bookingId, String token) {
        verifyBookingInternalToken(token);
        // Booking has checked the 3-minute deadline and its own state.
        // For this mock-only QR flow even SUCCESS is refunded when the Provider did not confirm.
        // This educational QR flow has no real bank reconciliation.
        // The claimed transfer is simulated as refunded; inventory is released by Booking.
        mockRefundByBooking(bookingId, token);
    }

    private void verifyBookingInternalToken(String token) {
        if (token == null || !token.equals(bookingInternalToken))
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Invalid internal token");
    }

    // =========================================================
    // CANCEL
    // =========================================================

    @Transactional
    public PaymentResponseDTO huyPayment(
            Long paymentId,
            Long userId,
            String role
    ) {

        Payment payment =
                timPayment(
                        paymentId
                );

        kiemTraQuyenXem(
                payment,
                userId,
                role
        );

        if (payment.getTrangThai()
                != TrangThaiPayment.PENDING) {

            throw new RuntimeException(
                    "Chỉ Payment PENDING mới được hủy"
            );
        }

        payment.setTrangThai(
                TrangThaiPayment.CANCELLED
        );

        return taoPaymentResponse(
                paymentRepository.save(
                        payment
                )
        );
    }

    // =========================================================
    // REFUND REQUEST
    // =========================================================

    @Transactional
    public RefundResponseDTO yeuCauHoanTien(
            Long paymentId,
            RefundRequestDTO request,
            Long userId,
            String role
    ) {
        // Customer cancellations are authorized by Booking Service (24h/provider policy),
        // never by the legacy direct Payment refund endpoint.
        if ("CUSTOMER".equalsIgnoreCase(role)) {
            throw new IllegalArgumentException(
                    "Vui lòng gửi yêu cầu hủy/hoàn tiền tại chi tiết đơn hàng"
            );
        }


        Payment payment =
                timPayment(
                        paymentId
                );

        kiemTraQuyenXem(
                payment,
                userId,
                role
        );

        if (payment.getTrangThai()
                != TrangThaiPayment.SUCCESS
                && payment.getTrangThai()
                != TrangThaiPayment.REFUND_PENDING) {

            throw new RuntimeException(
                    "Payment chưa thanh toán thành công nên không thể hoàn tiền"
            );
        }

        if (request.getIdempotencyKey() != null
                && !request
                .getIdempotencyKey()
                .isBlank()) {

            Optional<HoanTien> old =
                    hoanTienRepository
                            .findByPaymentIdAndIdempotencyKey(
                                    paymentId,
                                    request.getIdempotencyKey()
                            );

            if (old.isPresent()) {

                return taoRefundResponse(
                        old.get()
                );
            }
        }

        BigDecimal daHoan =
                hoanTienRepository
                        .findByPaymentIdAndTrangThai(
                                paymentId,
                                TrangThaiHoanTien.SUCCESS
                        )
                        .stream()
                        .map(
                                HoanTien::getSoTien
                        )
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        BigDecimal conLai =
                payment
                        .getSoTien()
                        .subtract(
                                daHoan
                        );

        if (request
                .getSoTien()
                .compareTo(
                        conLai
                ) > 0) {

            throw new RuntimeException(
                    "Số tiền hoàn vượt quá số tiền còn có thể hoàn"
            );
        }

        HoanTien refund =
                new HoanTien();

        refund.setMaHoanTien(
                taoMaRefund()
        );

        refund.setPayment(
                payment
        );

        refund.setBookingId(
                payment.getBookingId()
        );

        refund.setBookingItemId(
                request.getBookingItemId()
        );

        refund.setSoTien(
                request.getSoTien()
        );

        refund.setLyDo(
                request.getLyDo()
        );

        refund.setTrangThai(
                TrangThaiHoanTien.PENDING
        );

        refund.setIdempotencyKey(
                request.getIdempotencyKey()
        );

        payment.setTrangThai(
                TrangThaiPayment.REFUND_PENDING
        );

        paymentRepository.save(
                payment
        );

        HoanTien savedRefund = hoanTienRepository.save(refund);
        thongBaoBookingRefundPending(payment.getBookingId());
        return taoRefundResponse(savedRefund);
    }

    // =========================================================
    // REFUND CONFIRM
    // =========================================================

    @Transactional
    public RefundResponseDTO xacNhanHoanTien(
            Long refundId,
            String transactionCode,
            String role
    ) {

        if (!"ADMIN".equals(role)) {

            throw new RuntimeException(
                    "Chỉ ADMIN được xác nhận kết quả hoàn tiền"
            );
        }

        HoanTien refund =
                hoanTienRepository
                        .findById(
                                refundId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy yêu cầu hoàn tiền"
                                )
                        );

        if (refund.getTrangThai()
                != TrangThaiHoanTien.PENDING) {

            throw new RuntimeException(
                    "Yêu cầu hoàn tiền không ở trạng thái PENDING"
            );
        }

        if (transactionCode == null
                || transactionCode.isBlank()) {

            throw new RuntimeException(
                    "Mã giao dịch hoàn tiền không được để trống"
            );
        }

        refund.setTrangThai(
                TrangThaiHoanTien.SUCCESS
        );

        refund.setRefundTransactionCode(
                transactionCode.trim()
        );

        refund.setHoanTienLuc(
                LocalDateTime.now()
        );

        Payment payment =
                refund.getPayment();

        BigDecimal tongDaHoanSauLanNay =
                hoanTienRepository
                        .findByPaymentIdAndTrangThai(
                                payment.getId(),
                                TrangThaiHoanTien.SUCCESS
                        )
                        .stream()
                        .filter(item ->
                                !item
                                        .getId()
                                        .equals(
                                                refund.getId()
                                        )
                        )
                        .map(
                                HoanTien::getSoTien
                        )
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        )
                        .add(
                                refund.getSoTien()
                        );

        if (tongDaHoanSauLanNay
                .compareTo(
                        payment.getSoTien()
                ) >= 0) {

            payment.setTrangThai(
                    TrangThaiPayment.REFUNDED
            );

        } else {

            payment.setTrangThai(
                    TrangThaiPayment.SUCCESS
            );
        }

        paymentRepository.save(
                payment
        );

        HoanTien savedRefund = hoanTienRepository.save(refund);

        if (payment.getTrangThai() == TrangThaiPayment.REFUNDED) {
            thongBaoBookingRefunded(payment.getBookingId());
        }

        guiThongBaoSauCommit(
                payment.getKhachHangId(),
                "REFUND_SUCCESS",
                "Hoàn tiền thành công",
                "Yêu cầu hoàn tiền " + savedRefund.getMaHoanTien()
                        + " đã hoàn thành với số tiền " + savedRefund.getSoTien() + ".",
                "REFUND_SUCCESS:" + savedRefund.getId()
        );

        return taoRefundResponse(savedRefund);
    }

    // =========================================================
    // NOTIFICATION SERVICE
    // =========================================================

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
                        .body(body)
                        .retrieve()
                        .toBodilessEntity();
            } catch (Exception ignored) {
                // Notification không được làm rollback Payment/Refund.
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
    // BOOKING SERVICE
    // =========================================================

    private void chuanBiBookingThanhToan(Long bookingId) {
        try {
            restClient.put()
                    .uri(bookingUrl + "/api/bookings/internal/" + bookingId + "/prepare-payment")
                    .header("X-Internal-Token", bookingInternalToken)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            throw new RuntimeException("Không thể kiểm tra lại ưu đãi trước thanh toán: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<?, ?> layBooking(
            Long bookingId,
            String authorization
    ) {

        try {

            return restClient
                    .get()
                    .uri(
                            bookingUrl
                                    + "/api/bookings/"
                                    + bookingId
                    )
                    .header(
                            HttpHeaders.AUTHORIZATION,
                            authorization
                    )
                    .retrieve()
                    .body(
                            Map.class
                    );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Không lấy được Booking: "
                            + e.getMessage()
            );
        }
    }

    /*
     * Payment -> Booking.
     *
     * Không dùng ADMIN JWT.
     * Dùng X-Internal-Token.
     *
     * Endpoint phía Booking sẽ được bổ sung
     * ngay ở bước tiếp theo.
     */
    private void thongBaoBookingThanhCong(
            Long bookingId
    ) {

        if (bookingInternalToken == null
                || bookingInternalToken.isBlank()) {

            throw new RuntimeException(
                    "Chưa cấu hình Booking internal token"
            );
        }

        /*
         * 1. Payment đã được nhận.
         */
        restClient
                .put()
                .uri(
                        bookingUrl
                                + "/api/bookings/internal/"
                                + bookingId
                                + "/payment-received"
                )
                .header(
                        "X-Internal-Token",
                        bookingInternalToken
                )
                .retrieve()
                .toBodilessEntity();

        /*
         * 2. Payment SUCCESS.
         * Booking sẽ chuyển PAID và tiếp tục CONFIRMED.
         */
        restClient
                .put()
                .uri(
                        bookingUrl
                                + "/api/bookings/internal/"
                                + bookingId
                                + "/payment-success"
                )
                .header(
                        "X-Internal-Token",
                        bookingInternalToken
                )
                .retrieve()
                .toBodilessEntity();
    }

    private void thongBaoBookingRefundPending(Long bookingId) {
        restClient.put()
                .uri(bookingUrl + "/api/bookings/internal/" + bookingId + "/refund-pending")
                .header("X-Internal-Token", bookingInternalToken)
                .retrieve().toBodilessEntity();
    }

    private void thongBaoBookingRefunded(Long bookingId) {
        restClient.put()
                .uri(bookingUrl + "/api/bookings/internal/" + bookingId + "/refunded")
                .header("X-Internal-Token", bookingInternalToken)
                .retrieve().toBodilessEntity();
    }

    // =========================================================
    // TRANSACTION
    // =========================================================

    private void luuGiaoDich(
            Payment payment,
            SePayWebhookDTO request,
            String bookingCode,
            KetQuaDoiSoat ketQua
    ) {

        GiaoDichThanhToan giaoDich =
                new GiaoDichThanhToan();

        giaoDich.setPayment(
                payment
        );

        giaoDich.setTransactionCode(
                request
                        .getTransactionCode()
                        .trim()
        );

        giaoDich.setSoTien(
                request.getAmount()
        );

        giaoDich.setNoiDungChuyenKhoan(
                request.getContent()
        );

        giaoDich.setMaBookingPhatHien(
                bookingCode
        );

        giaoDich.setThoiGianGiaoDich(
                request.getTransactionTime()
        );

        giaoDich.setKetQuaDoiSoat(
                ketQua
        );

        try {

            giaoDich.setDuLieuGoc(
                    objectMapper
                            .writeValueAsString(
                                    request
                            )
            );

        } catch (Exception e) {

            giaoDich.setDuLieuGoc(
                    request.toString()
            );
        }

        giaoDichRepository.save(
                giaoDich
        );
    }

    // =========================================================
    // FIND PAYMENT FROM CONTENT
    // =========================================================

    private Optional<Payment>
    timPaymentTheoNoiDung(
            String content
    ) {

        if (content == null
                || content.isBlank()) {

            return Optional.empty();
        }

        String normalizedContent =
                content
                        .trim()
                        .toUpperCase();

        return paymentRepository
                .findAll()
                .stream()
                .filter(payment ->
                        payment.getMaBooking() != null
                                && normalizedContent
                                .contains(
                                        payment
                                                .getMaBooking()
                                                .toUpperCase()
                                )
                )
                .findFirst();
    }

    // =========================================================
    // QR URL
    // =========================================================

    private String taoQrUrl(
            String maBooking,
            BigDecimal soTien
    ) {

        /*
         * VietQR dùng đơn vị VND nguyên.
         */
        BigDecimal soTienVnd =
                soTien.setScale(
                        0,
                        RoundingMode.UNNECESSARY
                );

        long amount =
                soTienVnd.longValueExact();

        String base =
                vietQrBaseUrl
                        + "/"
                        + bankId
                        + "-"
                        + accountNumber
                        + "-"
                        + vietQrTemplate
                        + ".png";

        return UriComponentsBuilder
                .fromUriString(
                        base
                )
                .queryParam(
                        "amount",
                        amount
                )
                .queryParam(
                        "addInfo",
                        maBooking
                )
                .queryParam(
                        "accountName",
                        accountName
                )
                .build()
                .encode()
                .toUriString();
    }

    // =========================================================
    // PERMISSION
    // =========================================================

    private void kiemTraQuyenXem(
            Payment payment,
            Long userId,
            String role
    ) {

        if ("ADMIN".equals(role)) {

            return;
        }

        if ("CUSTOMER".equals(role)
                && payment
                .getKhachHangId()
                .equals(
                        userId
                )) {

            return;
        }

        throw new RuntimeException(
                "Bạn không có quyền truy cập Payment này"
        );
    }

    // =========================================================
    // FIND
    // =========================================================

    private Payment timPayment(
            Long paymentId
    ) {

        return paymentRepository
                .findById(
                        paymentId
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy Payment"
                        )
                );
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    private PaymentResponseDTO taoPaymentResponse(
            Payment payment
    ) {

        return new PaymentResponseDTO(
                payment.getId(),
                payment.getMaThanhToan(),
                payment.getBookingId(),
                payment.getMaBooking(),
                payment.getKhachHangId(),
                payment.getSoTien(),
                payment.getPhuongThuc(),
                payment.getTrangThai(),
                payment.getMaNganHang(),
                payment.getSoTaiKhoan(),
                payment.getTenTaiKhoan(),
                payment.getNoiDungChuyenKhoan(),
                payment.getQrUrl(),
                payment.getTransactionCode(),
                payment.getPaypalOrderId(),
                payment.getPaypalCaptureId(),
                payment.getPaypalApprovalUrl(),
                payment.getPaypalCurrency(),
                payment.getPaypalAmount(),
                payment.getHetHanLuc(),
                payment.getNgayTao(),
                payment.getThanhToanLuc(),
                payment.getPayosPaymentLinkId(),
                payment.getPayosCheckoutUrl()
        );
    }

    private RefundResponseDTO taoRefundResponse(
            HoanTien refund
    ) {

        return new RefundResponseDTO(
                refund.getId(),
                refund.getMaHoanTien(),
                refund.getPayment().getId(),
                refund.getBookingId(),
                refund.getBookingItemId(),
                refund.getSoTien(),
                refund.getLyDo(),
                refund.getTrangThai(),
                refund.getRefundTransactionCode(),
                refund.getNgayTao(),
                refund.getHoanTienLuc()
        );
    }

    // =========================================================
    // UTIL
    // =========================================================

    private String taoMaPayment() {

        return "PAY-"
                + UUID.randomUUID()
                .toString()
                .substring(
                        0,
                        10
                )
                .toUpperCase();
    }

    private String taoMaRefund() {

        return "REF-"
                + UUID.randomUUID()
                .toString()
                .substring(
                        0,
                        10
                )
                .toUpperCase();
    }

    private Long toLong(
            Object value
    ) {

        if (value == null) {

            throw new RuntimeException(
                    "Không đọc được ID từ Booking Service"
            );
        }

        if (value instanceof Number number) {

            return number.longValue();
        }

        return Long.valueOf(
                value.toString()
        );
    }

    private BigDecimal toBigDecimal(
            Object value
    ) {

        if (value == null) {

            throw new RuntimeException(
                    "Không đọc được số tiền Booking"
            );
        }

        return new BigDecimal(
                value.toString()
        );
    }

    private LocalDateTime parseDateTime(
            Object value
    ) {

        if (value == null) {

            return LocalDateTime
                    .now()
                    .plusMinutes(
                            15
                    );
        }

        try {

            return LocalDateTime.parse(
                    value.toString()
            );

        } catch (Exception e) {

            return LocalDateTime
                    .now()
                    .plusMinutes(
                            15
                    );
        }
    }

    public String getSePayWebhookSecret() {

        return sePayWebhookSecret;
    }
}
