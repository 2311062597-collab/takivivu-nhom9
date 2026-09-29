package com.example.bookingservice.service;

import com.example.bookingservice.entity.TrangThaiBooking;
import com.example.bookingservice.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class BookingExpiryScheduler {
    private static final Logger log = LoggerFactory.getLogger(BookingExpiryScheduler.class);
    private final BookingRepository repository;
    private final BookingService service;

    public BookingExpiryScheduler(BookingRepository repository, BookingService service) {
        this.repository = repository;
        this.service = service;
    }

    @Scheduled(fixedDelayString = "${booking.expiry-check-ms:30000}")
    public void expireOverdueBookings() {
        repository.findByTrangThaiAndHetHanThanhToanLessThanEqual(
                TrangThaiBooking.PENDING_PAYMENT, LocalDateTime.now())
            .forEach(booking -> {
                try { service.hetHanTuDong(booking.getId()); }
                catch (Exception e) { log.error("BOOKING_EXPIRY_FAILED id={}", booking.getId(), e); }
            });
        repository.findByTrangThaiAndHetHanThanhToanLessThanEqual(
                TrangThaiBooking.PAYMENT_RECEIVED, LocalDateTime.now())
            .forEach(booking -> {
                try { service.hetHanXacNhanNhaCungCap(booking.getId()); }
                catch (Exception e) { log.error("PROVIDER_CONFIRM_TIMEOUT_FAILED id={}", booking.getId(), e); }
            });
        repository.findByTrangThaiAndHanXuLyHuyLessThanEqual(
                TrangThaiBooking.CANCEL_REQUESTED, LocalDateTime.now())
            .forEach(booking -> {
                try { service.tuDongDuyetYeuCauHuy(booking.getId()); }
                catch (Exception e) { log.error("CANCEL_REQUEST_AUTO_APPROVE_FAILED id={}", booking.getId(), e); }
            });
    }
}
