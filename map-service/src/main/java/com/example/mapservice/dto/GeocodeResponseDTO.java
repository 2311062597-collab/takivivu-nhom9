package com.example.mapservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class GeocodeResponseDTO {

    private String address;
    private Double latitude;
    private Double longitude;
    private String placeId;
    private String city;
    private String district;
    private String specificAddress;

    public GeocodeResponseDTO(
            String address,
            Double latitude,
            Double longitude,
            String placeId
    ) {
        this(address, latitude, longitude, placeId, null, null, null);
    }

    public GeocodeResponseDTO(
            String address,
            Double latitude,
            Double longitude,
            String placeId,
            String city,
            String district,
            String specificAddress
    ) {
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.placeId = placeId;
        this.city = city;
        this.district = district;
        this.specificAddress = specificAddress;
    }
}
