package com.example.mapservice.controller;

import com.example.mapservice.dto.DistanceResponseDTO;
import com.example.mapservice.dto.GeocodeResponseDTO;
import com.example.mapservice.dto.PlaceDetailResponseDTO;
import com.example.mapservice.dto.PlaceSearchResponseDTO;
import com.example.mapservice.service.MapService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maps")
public class MapController {

    private final MapService mapService;

    public MapController(
            MapService mapService
    ) {
        this.mapService = mapService;
    }

    // =========================================================
    // GET /api/maps/geocode?address=...
    // =========================================================

    @GetMapping("/geocode")
    public ResponseEntity<GeocodeResponseDTO>
    geocode(
            @RequestParam String address
    ) {

        return ResponseEntity.ok(
                mapService.geocode(
                        address
                )
        );
    }

    // =========================================================
    // GET /api/maps/search?keyword=...
    // =========================================================

    @GetMapping("/search")
    public ResponseEntity<List<PlaceSearchResponseDTO>>
    search(
            @RequestParam String keyword
    ) {

        return ResponseEntity.ok(
                mapService.search(
                        keyword
                )
        );
    }

    // =========================================================
    // GET /api/maps/place/{placeId}
    // =========================================================

    @GetMapping("/place/{placeId}")
    public ResponseEntity<PlaceDetailResponseDTO>
    placeDetail(
            @PathVariable String placeId
    ) {

        return ResponseEntity.ok(
                mapService.placeDetail(
                        placeId
                )
        );
    }

    // =========================================================
    // GET /api/maps/current-location
    //
    // Trình duyệt lấy latitude/longitude sau khi user cấp quyền,
    // sau đó gửi tọa độ sang đây để reverse geocode.
    // =========================================================

    @GetMapping("/current-location")
    public ResponseEntity<GeocodeResponseDTO>
    currentLocation(
            @RequestParam Double latitude,
            @RequestParam Double longitude
    ) {

        return ResponseEntity.ok(
                mapService.reverseGeocode(
                        latitude,
                        longitude
                )
        );
    }

    // =========================================================
    // GET /api/maps/distance
    // =========================================================

    @GetMapping("/distance")
    public ResponseEntity<DistanceResponseDTO>
    distance(
            @RequestParam Double originLat,
            @RequestParam Double originLng,
            @RequestParam Double destinationLat,
            @RequestParam Double destinationLng
    ) {

        return ResponseEntity.ok(
                mapService.distance(
                        originLat,
                        originLng,
                        destinationLat,
                        destinationLng
                )
        );
    }
}