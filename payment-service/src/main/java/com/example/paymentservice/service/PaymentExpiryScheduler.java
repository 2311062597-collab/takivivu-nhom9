package com.example.paymentservice.service;

import com.example.paymentservice.entity.TrangThaiPayment;
import com.example.paymentservice.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Component
public class PaymentExpiryScheduler {
    private static final Logger log = LoggerFactory.getLogger(PaymentExpiryScheduler.class);
    private final PaymentRepository repository;
    private final org.springframework.web.client.RestClient restClient = org.springframework.web.client.RestClient.create();
    @org.springframework.beans.factory.annotation.Value("${service.booking.url}")
    private String bookingUrl;
    @org.springframework.beans.factory.annotation.Value("${service.booking.internal-token}")
    private String internalToken;
    public PaymentExpiryScheduler(PaymentRepository repository) { this.repository = repository; }

    @Scheduled(fixedDelayString = "${payment.expiry-check-ms:30000}")
    @Transactional
    public void expirePendingPayments() {
        repository.findByTrangThaiAndHetHanLucLessThanEqual(
                TrangThaiPayment.PENDING, LocalDateTime.now()).forEach(payment -> {
            try {
                // Booking is authoritative. Never cancel a claimed transfer or
                // a confirmed booking based on the original payment deadline.
                java.util.Map<?, ?> booking = restClient.get()
                        .uri(bookingUrl + "/api/bookings/internal/" + payment.getBookingId() + "/payment-state")
                        .header("X-Internal-Token", internalToken)
                        .retrieve().body(java.util.Map.class);
                String state = booking == null ? "UNKNOWN" : String.valueOf(booking.get("trangThai"));
                if ("PAYMENT_RECEIVED".equals(state) || "PAID".equals(state)
                        || "CONFIRMED".equals(state) || "COMPLETED".equals(state)) return;
                if (!"PENDING_PAYMENT".equals(state) && !"EXPIRED".equals(state)
                        && !"CANCELLED".equals(state)) return;
                payment.setTrangThai(TrangThaiPayment.CANCELLED);
                repository.save(payment);
            } catch (Exception e) {
                log.error("PAYMENT_EXPIRY_FAILED id={}", payment.getId(), e);
            }
        });
    }
}
