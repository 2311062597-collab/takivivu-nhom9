package com.example.bookingservice.repository;

import com.example.bookingservice.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository
        extends JpaRepository<Booking, Long> {

    // Applies to all services: FLIGHT, HOTEL and ATTRACTION.
    List<Booking> findByTrangThaiAndHetHanThanhToanLessThanEqual(
            com.example.bookingservice.entity.TrangThaiBooking trangThai,
            LocalDateTime now
    );


    List<Booking> findByTrangThaiAndHanXuLyHuyLessThanEqual(
            com.example.bookingservice.entity.TrangThaiBooking trangThai, LocalDateTime now);

    Optional<Booking> findByMaBooking(
            String maBooking
    );

    Optional<Booking>
    findByKhachHangIdAndIdempotencyKey(
            Long khachHangId,
            String idempotencyKey
    );

    List<Booking> findByKhachHangIdOrderByIdDesc(
            Long khachHangId
    );
    @Query("select distinct b from Booking b join b.danhSachItem i where i.nhaCungCapId = :providerId and b.trangThai <> com.example.bookingservice.entity.TrangThaiBooking.PENDING_PAYMENT order by b.id desc")
    List<Booking> findVisibleForProvider(@Param("providerId") Long providerId);
}