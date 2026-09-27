package com.example.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalUserContactResponseDTO {

    private Long userId;
    private String hoTen;
    private String email;
    private Boolean exists;
}
