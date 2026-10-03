package com.example.promotionservice.repository;

import com.example.promotionservice.entity.PromotionUsage;
import com.example.promotionservice.entity.UsageStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;

public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, Long> {
    Optional<PromotionUsage> findByBookingId(Long bookingId);
    long countByPromotionIdAndStatusIn(Long promotionId, Collection<UsageStatus> statuses);
    long countByPromotionIdAndCustomerIdAndStatusIn(Long promotionId, Long customerId, Collection<UsageStatus> statuses);
    boolean existsByPromotionId(Long promotionId);
}
