package com.example.authservice.repository;

import com.example.authservice.entity.CaiDatHeThong;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CaiDatHeThongRepository extends JpaRepository<CaiDatHeThong, Long> {
    Optional<CaiDatHeThong> findByKhoa(String khoa);
    List<CaiDatHeThong> findAllByOrderByIdAsc();
}
