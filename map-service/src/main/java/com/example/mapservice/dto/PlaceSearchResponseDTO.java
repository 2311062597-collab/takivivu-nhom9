package com.example.mapservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaceSearchResponseDTO {

    private String name;

    private String address;

    private String area;

    private String placeId;

    private Double latitude;

    private Double longitude;
}