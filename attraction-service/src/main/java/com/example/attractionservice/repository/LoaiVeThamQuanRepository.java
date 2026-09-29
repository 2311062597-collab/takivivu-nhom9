package com.example.attractionservice.repository;

import com.example.attractionservice.entity.LoaiVeThamQuan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface LoaiVeThamQuanRepository
        extends JpaRepository<LoaiVeThamQuan, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<LoaiVeThamQuan> findLockedById(Long id);

    List<LoaiVeThamQuan> findByDiaDiemId(
            Long diaDiemId
    );

    boolean existsByDiaDiemId(
            Long diaDiemId
    );

    boolean existsByDiaDiemIdAndMaLoaiVe(
            Long diaDiemId,
            String maLoaiVe
    );

    boolean existsByDiaDiemIdAndMaLoaiVeAndIdNot(
            Long diaDiemId,
            String maLoaiVe,
            Long id
    );
}