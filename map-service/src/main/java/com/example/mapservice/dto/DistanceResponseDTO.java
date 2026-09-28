package com.example.mapservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DistanceResponseDTO {

    private Double distanceMeters;

    private String distanceText;

    private Long durationSeconds;

    private String durationText;
}