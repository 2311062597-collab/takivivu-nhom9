package com.example.paymentservice.service;

import com.example.paymentservice.entity.Payment;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;

@Component
public class PayosClient {
    @Value("${payos.base-url:https://api-merchant.payos.vn}") private String baseUrl;
    @Value("${payos.client-id:}") private String clientId;
    @Value("${payos.api-key:}") private String apiKey;
    @Value("${payos.checksum-key:}") private String checksumKey;
    @Value("${payos.return-url:http://localhost:5173/payments/new}") private String returnUrl;
    @Value("${payos.cancel-url:http://localhost:5173/payments/new}") private String cancelUrl;
    private final RestClient http = RestClient.create();
    private final ObjectMapper mapper;
    public PayosClient(ObjectMapper mapper) { this.mapper = mapper; }

    public void create(Payment payment) {
        configured();
        long amount = vnd(payment.getSoTien());
        String description = "TKV" + payment.getId();
        String success = withBooking(returnUrl, payment.getBookingId());
        String cancel = withBooking(cancelUrl, payment.getBookingId());
        String raw = "amount=" + amount + "&cancelUrl=" + cancel + "&description=" + description
                + "&orderCode=" + payment.getId() + "&returnUrl=" + success;
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("orderCode", payment.getId()); body.put("amount", amount);
        body.put("description", description); body.put("returnUrl", success); body.put("cancelUrl", cancel);
        body.put("signature", hmac(raw));
        if (payment.getHetHanLuc() != null)
            body.put("expiredAt", payment.getHetHanLuc().atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toEpochSecond());
        JsonNode result = http.post().uri(baseUrl + "/v2/payment-requests")
                .header("x-client-id", clientId).header("x-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON).body(body).retrieve().body(JsonNode.class);
        if (result == null || !"00".equals(result.path("code").asText())
                || result.path("data").path("checkoutUrl").asText().isBlank())
            throw new IllegalStateException("PayOS không tạo được liên kết thanh toán");
        payment.setPayosPaymentLinkId(result.path("data").path("paymentLinkId").asText());
        payment.setPayosCheckoutUrl(result.path("data").path("checkoutUrl").asText());
    }

    public JsonNode verifiedData(JsonNode webhook) {
        configured();
        JsonNode data = webhook.path("data");
        String signature = webhook.path("signature").asText("");
        if (!data.isObject() || !signature.matches("(?i)[0-9a-f]{64}"))
            throw new IllegalArgumentException("Webhook PayOS không hợp lệ");
        TreeMap<String, String> fields = new TreeMap<>();
        data.fields().forEachRemaining(entry -> {
            JsonNode value = entry.getValue();
            fields.put(entry.getKey(), value.isNull() ? "" : value.isTextual() ? value.asText() : value.toString());
        });
        StringBuilder raw = new StringBuilder();
        fields.forEach((key, value) -> {
            if (!raw.isEmpty()) raw.append('&');
            raw.append(key).append('=').append(value);
        });
        if (!MessageDigest.isEqual(hmac(raw.toString()).getBytes(StandardCharsets.US_ASCII),
                signature.toLowerCase().getBytes(StandardCharsets.US_ASCII)))
            throw new IllegalArgumentException("Chữ ký webhook PayOS không hợp lệ");
        return data;
    }

    public void cancel(Payment payment) {
        if (payment.getPayosPaymentLinkId() == null) return;
        configured();
        JsonNode result = http.post().uri(baseUrl + "/v2/payment-requests/" + payment.getId() + "/cancel")
                .header("x-client-id", clientId).header("x-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("cancellationReason", "Customer changed payment method"))
                .retrieve().body(JsonNode.class);
        if (result == null || !"00".equals(result.path("code").asText())
                || !"CANCELLED".equals(result.path("data").path("status").asText()))
            throw new IllegalStateException("Không hủy được liên kết PayOS; vui lòng kiểm tra trạng thái thanh toán");
    }

    private String withBooking(String url, Long bookingId) {
        return url + (url.contains("?") ? "&" : "?") + "bookingId=" + bookingId;
    }
    private long vnd(BigDecimal amount) {
        try { long value = amount.longValueExact(); if (value <= 0) throw new ArithmeticException(); return value; }
        catch (ArithmeticException e) { throw new IllegalArgumentException("Số tiền PayOS phải là số nguyên VND dương"); }
    }
    private void configured() {
        if (clientId.isBlank() || apiKey.isBlank() || checksumKey.isBlank())
            throw new IllegalStateException("Chưa cấu hình PAYOS_CLIENT_ID, PAYOS_API_KEY và PAYOS_CHECKSUM_KEY");
    }
    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(checksumKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new IllegalStateException("Không ký được dữ liệu PayOS", e); }
    }
}
