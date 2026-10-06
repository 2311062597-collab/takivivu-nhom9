package com.example.flightservice.repository;
import com.example.flightservice.entity.DanhGiaChuyenBay;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface DanhGiaChuyenBayRepository extends JpaRepository<DanhGiaChuyenBay,Long>{
 List<DanhGiaChuyenBay> findByUserIdOrderByNgayTaoDesc(Long userId);
 Optional<DanhGiaChuyenBay> findByBookingIdAndTargetId(Long bookingId, Long targetId);
 List<DanhGiaChuyenBay> findByTargetIdOrderByNgayTaoDesc(Long targetId);
}
