package com.example.attractionservice.repository;

import com.example.attractionservice.entity.GiuVeThamQuan;
import com.example.attractionservice.entity.TrangThaiGiuVe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GiuVeThamQuanRepository
        extends JpaRepository<GiuVeThamQuan, Long> {

    Optional<GiuVeThamQuan>
    findByBookingIdAndLoaiVeId(
            Long bookingId,
            Long loaiVeId
    );

    Optional<GiuVeThamQuan> findByBookingIdAndLoaiVeIdAndNgaySuDung(
            Long bookingId, Long loaiVeId, LocalDate ngaySuDung
    );

    List<GiuVeThamQuan> findByBookingId(
            Long bookingId
    );

    boolean existsByLoaiVeId(
            Long loaiVeId
    );

    @Query("""
            SELECT COALESCE(SUM(g.soLuongVe), 0)
            FROM GiuVeThamQuan g
            WHERE g.loaiVe.id = :loaiVeId
            AND g.ngaySuDung = :ngaySuDung
            AND (
                g.trangThai = :confirmed
                OR (
                    g.trangThai = :holding
                    AND g.hetHanLuc > :hienTai
                )
            )
            """)
    Long tongVeDangDuocGiu(
            @Param("loaiVeId")
            Long loaiVeId,

            @Param("ngaySuDung")
            LocalDate ngaySuDung,

            @Param("hienTai")
            LocalDateTime hienTai,

            @Param("holding")
            TrangThaiGiuVe holding,

            @Param("confirmed")
            TrangThaiGiuVe confirmed
    );
}