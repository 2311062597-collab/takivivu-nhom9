package com.example.hotelservice.repository;

import com.example.hotelservice.entity.KhachSan;
import com.example.hotelservice.entity.TrangThaiKhachSan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KhachSanRepository extends JpaRepository<KhachSan, Long> {

    List<KhachSan> findByNhaCungCapId(Long nhaCungCapId);

    List<KhachSan> findByThanhPhoContainingIgnoreCaseAndTrangThai(
            String thanhPho,
            TrangThaiKhachSan trangThai
    );
}