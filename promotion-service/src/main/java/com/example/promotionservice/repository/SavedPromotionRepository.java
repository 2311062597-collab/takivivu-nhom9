package com.example.promotionservice.repository;

import com.example.promotionservice.entity.SavedPromotion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SavedPromotionRepository extends JpaRepository<SavedPromotion, Long> {
    boolean existsByCustomerIdAndPromotionId(Long customerId, Long promotionId);
    List<SavedPromotion> findByCustomerIdOrderBySavedAtDesc(Long customerId);
    long deleteByCustomerIdAndPromotionId(Long customerId, Long promotionId);
}
