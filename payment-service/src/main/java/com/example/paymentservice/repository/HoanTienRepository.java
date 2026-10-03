package com.example.paymentservice.repository;

import com.example.paymentservice.entity.HoanTien;
import com.example.paymentservice.entity.TrangThaiHoanTien;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface HoanTienRepository
        extends JpaRepository<HoanTien, Long> {

    Optional<HoanTien>
    findByPaymentIdAndIdempotencyKey(
            Long paymentId,
            String idempotencyKey
    );

    List<HoanTien> findByPaymentId(
            Long paymentId
    );

    List<HoanTien> findAllByOrderByIdDesc();

    List<HoanTien>
    findByPaymentIdAndTrangThai(
            Long paymentId,
            TrangThaiHoanTien trangThai
    );
}