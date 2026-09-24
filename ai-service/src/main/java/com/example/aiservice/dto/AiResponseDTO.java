package com.example.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiResponseDTO {

    private String answer;

    private String intent;

    private boolean canNavigate;

    private String navigateTo;
}