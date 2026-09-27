package com.example.authservice.repository;

import com.example.authservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findBySoDienThoai(String soDienThoai);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsBySoDienThoai(String soDienThoai);

    List<User> findByVaiTroOrderByNgayTaoDesc(com.example.authservice.entity.VaiTro vaiTro);

    List<User> findAllByOrderByNgayTaoDesc();

    long countByVaiTro(com.example.authservice.entity.VaiTro vaiTro);

    long countByTrangThai(com.example.authservice.entity.TrangThaiNguoiDung trangThai);
}