package com.example.notificationservice.dto;

import com.example.notificationservice.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaoNotificationRequestDTO {

    @NotNull(message = "userId không được để trống")
    private Long userId;

    @NotBlank(message = "title không được để trống")
    @Size(
            max = 255,
            message = "title tối đa 255 ký tự"
    )
    private String title;

    @NotBlank(message = "message không được để trống")
    private String message;

    @NotNull(message = "type không được để trống")
    private NotificationType type;

    @NotBlank(message = "eventId không được để trống")
    @Size(
            max = 150,
            message = "eventId tối đa 150 ký tự"
    )
    private String eventId;
}