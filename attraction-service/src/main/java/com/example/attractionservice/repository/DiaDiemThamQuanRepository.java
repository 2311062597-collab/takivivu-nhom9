package com.example.attractionservice.repository;

import com.example.attractionservice.entity.DiaDiemThamQuan;
import com.example.attractionservice.entity.TrangThaiDiaDiem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiaDiemThamQuanRepository
        extends JpaRepository<DiaDiemThamQuan, Long> {

    List<DiaDiemThamQuan> findByNhaCungCapId(
            Long nhaCungCapId
    );

    List<DiaDiemThamQuan>
    findByThanhPhoContainingIgnoreCaseAndTrangThai(
            String thanhPho,
            TrangThaiDiaDiem trangThai
    );
}