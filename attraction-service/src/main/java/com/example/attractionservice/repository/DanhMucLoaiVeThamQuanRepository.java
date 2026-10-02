package com.example.attractionservice.repository;

import com.example.attractionservice.entity.DanhMucLoaiVeThamQuan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DanhMucLoaiVeThamQuanRepository extends JpaRepository<DanhMucLoaiVeThamQuan, String> {
    List<DanhMucLoaiVeThamQuan> findByActiveTrueOrderByThuTuAsc();
}
