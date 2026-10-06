package com.example.attractionservice.repository;

import com.example.attractionservice.entity.DanhGiaDiaDiem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface DanhGiaDiaDiemRepository extends JpaRepository<DanhGiaDiaDiem, Long> {
    List<DanhGiaDiaDiem> findByUserIdOrderByNgayTaoDesc(Long userId);
    Optional<DanhGiaDiaDiem> findByBookingIdAndTargetId(Long bookingId, Long targetId);
    List<DanhGiaDiaDiem> findByTargetIdOrderByNgayTaoDesc(Long targetId);
}
