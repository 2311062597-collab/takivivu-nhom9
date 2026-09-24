package com.example.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthUserContactDTO {

    private Long userId;
    private String hoTen;
    private String email;
    private Boolean exists;
}
