package com.example.aiservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiRequestDTO {

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    @Size(max = 2000, message = "Nội dung câu hỏi tối đa 2000 ký tự")
    private String message;
}