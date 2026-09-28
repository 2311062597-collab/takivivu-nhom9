package com.example.mapservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaceDetailResponseDTO {

    private String placeId;

    private String name;

    private String address;

    private Double latitude;

    private Double longitude;
}