package com.example.paymentservice.repository;

import com.example.paymentservice.entity.GiaoDichThanhToan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GiaoDichThanhToanRepository
        extends JpaRepository<GiaoDichThanhToan, Long> {

    boolean existsByTransactionCode(
            String transactionCode
    );
}