package com.example.notificationservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:}")
    private String fromEmail;

    @Value("${app.mail.from-name:TAKIVIVU}")
    private String fromName;

    public EmailService(
            JavaMailSender javaMailSender
    ) {
        this.javaMailSender = javaMailSender;
    }

    public boolean guiEmail(
            String emailNguoiNhan,
            String tieuDe,
            String noiDung
    ) {

        if (!mailEnabled) {
            System.out.println(
                    "[EMAIL] Email dang tat. Bo qua gui den "
                            + emailNguoiNhan
            );
            return false;
        }

        if (emailNguoiNhan == null
                || emailNguoiNhan.isBlank()) {

            throw new IllegalArgumentException(
                    "Email nguoi nhan khong hop le."
            );
        }

        if (fromEmail == null
                || fromEmail.isBlank()) {

            throw new IllegalStateException(
                    "Chua cau hinh TAKIVIVU_MAIL_USERNAME."
            );
        }

        SimpleMailMessage mailMessage =
                new SimpleMailMessage();

        mailMessage.setFrom(
                fromName + " <" + fromEmail + ">"
        );

        mailMessage.setTo(
                emailNguoiNhan.trim()
        );

        mailMessage.setSubject(
                tieuDe
        );

        mailMessage.setText(
                noiDung
        );

        javaMailSender.send(
                mailMessage
        );

        return true;
    }
}
