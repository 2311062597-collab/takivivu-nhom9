package com.example.hotelservice.repository;
import com.example.hotelservice.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.*;
import java.util.*;
public interface PhysicalRoomHoldRepository extends JpaRepository<PhysicalRoomHold,Long> {
 List<PhysicalRoomHold> findByBookingId(Long id);
 boolean existsByPhongCuTheId(Long id);
 @Query("SELECT h FROM PhysicalRoomHold h WHERE h.phongCuTheId = :id AND h.ngayNhanPhong < :end AND h.ngayTraPhong > :start AND (h.trangThai = com.example.hotelservice.entity.TrangThaiGiuPhong.CONFIRMED OR (h.trangThai = com.example.hotelservice.entity.TrangThaiGiuPhong.HOLDING AND h.hetHanLuc > :now))")
 List<PhysicalRoomHold> overlapping(@Param("id") Long id,@Param("start") LocalDate start,@Param("end") LocalDate end,@Param("now") LocalDateTime now);
}
