package com.example.paymentservice.repository;

import com.example.paymentservice.entity.Payment;
import com.example.paymentservice.entity.PhuongThucThanhToan;
import com.example.paymentservice.entity.TrangThaiPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

    List<Payment> findByTrangThaiAndHetHanLucLessThanEqual(
            TrangThaiPayment status, LocalDateTime now);


    Optional<Payment> findByMaThanhToan(
            String maThanhToan
    );

    List<Payment> findAllByOrderByIdDesc();

    Optional<Payment> findByMaBooking(
            String maBooking
    );

    Optional<Payment> findFirstByMaBookingOrderByIdDesc(
            String maBooking
    );

    Optional<Payment> findByPaypalOrderId(
            String paypalOrderId
    );

    Optional<Payment> findByKhachHangIdAndIdempotencyKey(
            Long khachHangId,
            String idempotencyKey
    );

    Optional<Payment>
    findFirstByBookingIdAndPhuongThucAndTrangThaiOrderByIdDesc(
            Long bookingId,
            PhuongThucThanhToan phuongThuc,
            TrangThaiPayment trangThai
    );

    Optional<Payment> findFirstByBookingIdAndTrangThaiOrderByIdDesc(
            Long bookingId,
            TrangThaiPayment trangThai
    );

    List<Payment> findByKhachHangIdOrderByIdDesc(
            Long khachHangId
    );
}