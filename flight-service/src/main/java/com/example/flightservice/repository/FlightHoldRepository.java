package com.example.flightservice.repository;

import com.example.flightservice.entity.FlightHold;
import com.example.flightservice.entity.TrangThaiHold;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FlightHoldRepository
        extends JpaRepository<FlightHold, Long> {

    Optional<FlightHold>
    findByBookingIdAndChuyenBayId(
            Long bookingId,
            Long chuyenBayId
    );

    List<FlightHold> findByBookingId(
            Long bookingId
    );

    List<FlightHold> findByTrangThai(
            TrangThaiHold trangThai
    );
}