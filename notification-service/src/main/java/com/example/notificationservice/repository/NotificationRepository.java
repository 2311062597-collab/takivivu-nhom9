package com.example.notificationservice.repository;

import com.example.notificationservice.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    boolean existsByEventId(
            String eventId
    );

    Optional<Notification> findByEventId(
            String eventId
    );

    List<Notification>
    findByUserIdOrderByCreatedAtDesc(
            Long userId
    );

    Optional<Notification>
    findByIdAndUserId(
            Long id,
            Long userId
    );
}