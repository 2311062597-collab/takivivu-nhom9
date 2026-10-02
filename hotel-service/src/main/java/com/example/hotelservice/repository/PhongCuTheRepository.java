package com.example.hotelservice.repository;
import com.example.hotelservice.entity.PhongCuThe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PhongCuTheRepository extends JpaRepository<PhongCuThe,Long> {
 List<PhongCuThe> findByKhachSanIdOrderByTangAscSoPhongAsc(Long hotelId);
 boolean existsByKhachSanIdAndSoPhongIgnoreCase(Long hotelId,String number);
 boolean existsByKhachSanIdAndSoPhongIgnoreCaseAndIdNot(Long hotelId,String number,Long id);
 boolean existsByLoaiPhongId(Long id);
}