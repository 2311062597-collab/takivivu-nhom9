package com.example.authservice.repository;

import com.example.authservice.entity.ProviderProfile;
import com.example.authservice.entity.TrangThaiDuyet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProviderProfileRepository
        extends JpaRepository<ProviderProfile, Long> {

    Optional<ProviderProfile> findByNguoiDungId(Long nguoiDungId);

    List<ProviderProfile> findByTrangThaiDuyet(TrangThaiDuyet trangThaiDuyet);

    List<ProviderProfile> findAllByOrderByNgayTaoDesc();

    List<ProviderProfile> findByTrangThaiDuyetOrderByNgayTaoDesc(TrangThaiDuyet trangThaiDuyet);

    long countByTrangThaiDuyet(TrangThaiDuyet trangThaiDuyet);
}
