package com.example.promotionservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_saved_promotions", uniqueConstraints = @UniqueConstraint(name = "uq_customer_saved_promotion", columnNames = {"customer_id", "promotion_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SavedPromotion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "promotion_id", nullable = false, foreignKey = @ForeignKey(name = "fk_saved_promotion"))
    private Promotion promotion;

    @Column(name = "saved_at", insertable = false, updatable = false)
    private LocalDateTime savedAt;
}
