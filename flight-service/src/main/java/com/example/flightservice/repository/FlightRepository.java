package com.example.flightservice.repository;

import com.example.flightservice.entity.Flight;
import com.example.flightservice.entity.TrangThaiChuyenBay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FlightRepository
        extends JpaRepository<Flight, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Flight> findLockedById(Long id);

    Optional<Flight> findByMaChuyenBay(
            String maChuyenBay
    );

    boolean existsByMaChuyenBay(
            String maChuyenBay
    );

    boolean existsByMaChuyenBayIgnoreCaseAndThoiGianKhoiHanh(String maChuyenBay, LocalDateTime thoiGianKhoiHanh);

    boolean existsByMaChuyenBayIgnoreCaseAndThoiGianKhoiHanhAndIdNot(String maChuyenBay, LocalDateTime thoiGianKhoiHanh, Long id);

    List<Flight> findByNhaCungCapId(
            Long nhaCungCapId
    );

    List<Flight> findByDiemDiContainingIgnoreCaseAndDiemDenContainingIgnoreCaseAndThoiGianKhoiHanhBetweenAndTrangThai(
            String diemDi,
            String diemDen,
            LocalDateTime tuThoiGian,
            LocalDateTime denThoiGian,
            TrangThaiChuyenBay trangThai
    );
}