package com.example.hotelservice.repository;

import com.example.hotelservice.entity.DanhGiaKhachSan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface DanhGiaKhachSanRepository extends JpaRepository<DanhGiaKhachSan, Long> {
    List<DanhGiaKhachSan> findByUserIdOrderByNgayTaoDesc(Long userId);
    Optional<DanhGiaKhachSan> findByBookingIdAndTargetId(Long bookingId, Long targetId);
    List<DanhGiaKhachSan> findByTargetIdOrderByNgayTaoDesc(Long targetId);
}
