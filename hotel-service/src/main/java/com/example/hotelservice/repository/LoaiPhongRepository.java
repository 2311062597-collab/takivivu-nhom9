package com.example.hotelservice.repository;
import com.example.hotelservice.entity.LoaiPhong;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface LoaiPhongRepository extends JpaRepository<LoaiPhong,Long> {
 @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE) @Query("select t from LoaiPhong t where t.id=:id") Optional<LoaiPhong> locked(@Param("id") Long id);
 List<LoaiPhong> findByKhachSanIdOrderByIdDesc(Long id);
 boolean existsByKhachSanIdAndTenLoaiPhongIgnoreCase(Long hotelId,String name);
 boolean existsByKhachSanIdAndTenLoaiPhongIgnoreCaseAndIdNot(Long hotelId,String name,Long id);
}