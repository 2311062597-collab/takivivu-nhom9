package com.example.authservice.repository;

import com.example.authservice.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByNguoiThucHienId(Long nguoiThucHienId);
}