package com.example.notificationservice.service;

import com.example.notificationservice.dto.AuthUserContactDTO;
import com.example.notificationservice.dto.NotificationResponseDTO;
import com.example.notificationservice.dto.TaoNotificationRequestDTO;
import com.example.notificationservice.entity.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final RestClient restClient;

    @Value("${service.auth.url}")
    private String authServiceUrl;

    @Value("${notification.internal-token}")
    private String internalToken;

    @Value("${service.auth.internal-token}")
    private String authInternalToken;

    public NotificationService(
            NotificationRepository notificationRepository,
            EmailService emailService
    ) {

        this.notificationRepository =
                notificationRepository;

        this.emailService =
                emailService;

        this.restClient =
                RestClient.create();
    }

    // =========================================================
    // TAO THONG BAO TU SERVICE KHAC
    // =========================================================

    @Transactional
    public NotificationResponseDTO taoThongBao(
            TaoNotificationRequestDTO request,
            String receivedInternalToken
    ) {

        kiemTraInternalToken(
                receivedInternalToken
        );

        String title =
                chuanHoa(
                        request.getTitle()
                );

        String message =
                chuanHoa(
                        request.getMessage()
                );

        String eventId =
                chuanHoa(
                        request.getEventId()
                );

        if (request.getUserId() == null
                || request.getUserId() <= 0) {

            throw new IllegalArgumentException(
                    "userId khong hop le."
            );
        }

        if (request.getType() == null) {

            throw new IllegalArgumentException(
                    "type khong duoc de trong."
            );
        }

        /*
         * Idempotency:
         * neu eventId da ton tai thi khong tao notification
         * va khong gui email lan thu hai.
         */
        var existing =
                notificationRepository
                        .findByEventId(
                                eventId
                        );

        if (existing.isPresent()) {

            return toResponse(
                    existing.get()
            );
        }

        /*
         * Lay thong tin nguoi nhan tu Auth Service.
         * Notification Service khong truy cap truc tiep auth_db.
         */
        AuthUserContactDTO nguoiNhan =
                layThongTinNguoiNhan(
                        request.getUserId()
                );

        if (nguoiNhan == null
                || !Boolean.TRUE.equals(
                        nguoiNhan.getExists()
                )) {

            throw new IllegalArgumentException(
                    "Nguoi nhan khong ton tai."
            );
        }

        Notification notification =
                new Notification();

        notification.setUserId(
                request.getUserId()
        );

        notification.setTitle(
                title
        );

        notification.setMessage(
                message
        );

        notification.setType(
                request.getType()
        );

        notification.setEventId(
                eventId
        );

        notification.setIsRead(
                false
        );

        notification.setCreatedAt(
                LocalDateTime.now()
        );

        notification.setReadAt(
                null
        );

        Notification saved =
                notificationRepository.save(
                        notification
                );

        /*
         * Luu notification thanh cong truoc.
         * Neu SMTP loi, notification van duoc giu trong DB;
         * loi gui mail duoc ghi log, khong lam hong luong nghiep vu.
         */
        try {

            emailService.guiEmail(
                    nguoiNhan.getEmail(),
                    title,
                    taoNoiDungEmail(
                            nguoiNhan.getHoTen(),
                            message
                    )
            );

        } catch (Exception e) {

            System.err.println(
                    "[EMAIL] Gui email that bai cho userId="
                            + request.getUserId()
                            + ": "
                            + e.getMessage()
            );
        }

        return toResponse(saved);
    }

    // =========================================================
    // DANH SACH THONG BAO CUA USER HIEN TAI
    // =========================================================

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO>
    layThongBaoCuaToi(
            Long currentUserId
    ) {

        kiemTraCurrentUserId(
                currentUserId
        );

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(
                        currentUserId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // DANH DAU DA DOC
    // =========================================================

    @Transactional
    public NotificationResponseDTO danhDauDaDoc(
            Long notificationId,
            Long currentUserId
    ) {

        kiemTraCurrentUserId(
                currentUserId
        );

        if (notificationId == null
                || notificationId <= 0) {

            throw new IllegalArgumentException(
                    "notificationId khong hop le."
            );
        }

        Notification notification =
                notificationRepository
                        .findByIdAndUserId(
                                notificationId,
                                currentUserId
                        )
                        .orElseThrow(
                                () ->
                                        new SecurityException(
                                                "Ban khong co quyen xem hoac thay doi thong bao nay."
                                        )
                        );

        if (Boolean.TRUE.equals(
                notification.getIsRead()
        )) {

            return toResponse(
                    notification
            );
        }

        notification.setIsRead(
                true
        );

        notification.setReadAt(
                LocalDateTime.now()
        );

        return toResponse(
                notificationRepository.save(
                        notification
                )
        );
    }

    // =========================================================
    // AUTH USER CONTACT
    // =========================================================

    private AuthUserContactDTO layThongTinNguoiNhan(
            Long userId
    ) {

        try {

            AuthUserContactDTO result =
                    restClient
                            .get()
                            .uri(
                                    authServiceUrl
                                            + "/api/auth/users/"
                                            + userId
                                            + "/contact"
                            )
                            .header(
                                    "X-Internal-Token",
                                    authInternalToken
                            )
                            .retrieve()
                            .body(
                                    AuthUserContactDTO.class
                            );

            if (result == null) {

                throw new RuntimeException(
                        "Auth Service khong tra ve thong tin nguoi nhan."
                );
            }

            return result;

        } catch (Exception e) {

            throw new RuntimeException(
                    "Khong the lay thong tin nguoi nhan tu Auth Service.",
                    e
            );
        }
    }

    // =========================================================
    // EMAIL CONTENT
    // =========================================================

    private String taoNoiDungEmail(
            String hoTen,
            String message
    ) {

        String tenNguoiNhan =
                hoTen == null || hoTen.isBlank()
                        ? "ban"
                        : hoTen.trim();

        return "Xin chao "
                + tenNguoiNhan
                + ",\n\n"
                + message
                + "\n\n"
                + "Tran trong,\n"
                + "TAKIVIVU";
    }

    // =========================================================
    // INTERNAL TOKEN
    // =========================================================

    private void kiemTraInternalToken(
            String receivedToken
    ) {

        if (receivedToken == null
                || receivedToken.isBlank()
                || !internalToken.equals(
                receivedToken
        )) {

            throw new SecurityException(
                    "Internal token khong hop le."
            );
        }
    }

    // =========================================================
    // CURRENT USER
    // =========================================================

    private void kiemTraCurrentUserId(
            Long currentUserId
    ) {

        if (currentUserId == null
                || currentUserId <= 0) {

            throw new SecurityException(
                    "Khong xac dinh duoc nguoi dung hien tai."
            );
        }
    }

    // =========================================================
    // NORMALIZE
    // =========================================================

    private String chuanHoa(
            String value
    ) {

        if (value == null
                || value.isBlank()) {

            throw new IllegalArgumentException(
                    "Du lieu thong bao khong duoc de trong."
            );
        }

        return value
                .trim()
                .replaceAll(
                        "\\s+",
                        " "
                );
    }

    // =========================================================
    // ENTITY -> DTO
    // =========================================================

    private NotificationResponseDTO toResponse(
            Notification notification
    ) {

        return new NotificationResponseDTO(
                notification.getId(),
                notification.getUserId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getIsRead(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
