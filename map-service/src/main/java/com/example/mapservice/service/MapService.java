package com.example.mapservice.service;

import com.example.mapservice.dto.DistanceResponseDTO;
import com.example.mapservice.dto.GeocodeResponseDTO;
import com.example.mapservice.dto.PlaceDetailResponseDTO;
import com.example.mapservice.dto.PlaceSearchResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MapService {

    private final RestClient restClient;

    @Value("${google.maps.api-key}")
    private String apiKey;

    @Value("${google.maps.geocoding-url}")
    private String geocodingUrl;

    @Value("${google.maps.places-search-url}")
    private String placesSearchUrl;

    @Value("${google.maps.places-details-url}")
    private String placesDetailsUrl;

    @Value("${google.maps.routes-url}")
    private String routesUrl;

    @Value("${google.maps.language:vi}")
    private String language;

    @Value("${google.maps.region:VN}")
    private String region;

    @Value("${openstreetmap.nominatim-url:https://nominatim.openstreetmap.org/search}")
    private String nominatimUrl;

    public MapService() {
        this.restClient = RestClient.create();
    }

    // =========================================================
    // GEOCODE ADDRESS
    // =========================================================

    @SuppressWarnings("unchecked")
    public GeocodeResponseDTO geocode(String address) {
        String diaChi = chuanHoaChuoi(address);

        if (diaChi == null || diaChi.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập địa chỉ.");
        }

        if (apiKey == null || apiKey.isBlank()) {
            return geocodeNominatim(diaChi);
        }

        try {
            String url = UriComponentsBuilder
                    .fromUriString(geocodingUrl)
                    .queryParam("address", diaChi)
                    .queryParam("key", apiKey)
                    .queryParam("language", language)
                    .queryParam("region", region.toLowerCase())
                    .build()
                    .encode()
                    .toUriString();

            Map<String, Object> response = restClient
                    .get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            kiemTraGeocodingResponse(
                    response,
                    "Không thể xác định địa chỉ lúc này. Vui lòng thử lại."
            );

            List<Map<String, Object>> results =
                    (List<Map<String, Object>>) response.get("results");

            if (results == null || results.isEmpty()) {
                // Một số project chỉ bật Places API (New) mà chưa bật Geocoding API.
                // Thử Text Search để form Provider vẫn xác định được tọa độ.
                List<PlaceSearchResponseDTO> places = search(diaChi);
                if (places != null && !places.isEmpty()) {
                    PlaceSearchResponseDTO place = places.getFirst();
                    if (place.getLatitude() != null && place.getLongitude() != null) {
                        return taoGeocodeResponseTuChuoi(
                                place.getAddress(),
                                place.getLatitude(),
                                place.getLongitude(),
                                place.getPlaceId()
                        );
                    }
                }
                throw new IllegalArgumentException("Google Maps không tìm thấy địa chỉ phù hợp. Hãy nhập địa chỉ cụ thể hơn.");
            }

            Map<String, Object> result = results.getFirst();
            Map<String, Object> geometry =
                    (Map<String, Object>) result.get("geometry");

            if (geometry == null) {
                throw new IllegalArgumentException("Google Maps không trả về tọa độ cho địa chỉ này.");
            }

            Map<String, Object> location =
                    (Map<String, Object>) geometry.get("location");

            if (location == null) {
                throw new IllegalArgumentException("Google Maps không trả về tọa độ cho địa chỉ này.");
            }

            Double latitude = toDouble(location.get("lat"));
            Double longitude = toDouble(location.get("lng"));
            kiemTraToaDo(latitude, longitude);

            return taoGeocodeResponse(
                    result,
                    latitude,
                    longitude
            );
        } catch (Exception googleError) {
            // Local/dev fallback: geocode by OpenStreetMap when Google key/API is unavailable.
            // This keeps the Provider address search usable without changing the frontend flow.
            try {
                return geocodeNominatim(diaChi);
            } catch (Exception fallbackError) {
                if (googleError instanceof IllegalArgumentException illegalArgumentException) {
                    throw illegalArgumentException;
                }
                throw new RuntimeException("Không thể tìm địa chỉ trên bản đồ. Kiểm tra kết nối mạng hoặc cấu hình GOOGLE_MAPS_API_KEY.");
            }
        }
    }

    // =========================================================
    // TEXT SEARCH - PLACES API (NEW)
    // =========================================================

    @SuppressWarnings("unchecked")
    public List<PlaceSearchResponseDTO> search(String keyword) {
        String tuKhoa = chuanHoaChuoi(keyword);

        if (tuKhoa == null || tuKhoa.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập từ khóa.");
        }

        if (tuKhoa.length() > 200) {
            throw new IllegalArgumentException(
                    "Từ khóa tìm kiếm không được vượt quá 200 ký tự."
            );
        }

        kiemTraApiKey();

        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("textQuery", tuKhoa);
            body.put("languageCode", language);
            body.put("regionCode", region.toUpperCase());
            body.put("pageSize", 20);

            Map<String, Object> response = restClient
                    .post()
                    .uri(placesSearchUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Goog-Api-Key", apiKey)
                    .header(
                            "X-Goog-FieldMask",
                            "places.id,places.displayName,places.formattedAddress,places.location"
                    )
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            List<PlaceSearchResponseDTO> danhSach = new ArrayList<>();

            if (response == null) {
                return danhSach;
            }

            List<Map<String, Object>> places =
                    (List<Map<String, Object>>) response.get("places");

            if (places == null) {
                return danhSach;
            }

            for (Map<String, Object> place : places) {
                Map<String, Object> displayName =
                        (Map<String, Object>) place.get("displayName");
                Map<String, Object> location =
                        (Map<String, Object>) place.get("location");

                String name = displayName == null
                        ? null
                        : stringValue(displayName.get("text"));
                String address = stringValue(place.get("formattedAddress"));
                String placeId = stringValue(place.get("id"));

                Double latitude = location == null
                        ? null
                        : toDoubleNullable(location.get("latitude"));
                Double longitude = location == null
                        ? null
                        : toDoubleNullable(location.get("longitude"));

                danhSach.add(new PlaceSearchResponseDTO(
                        name,
                        address,
                        layKhuVuc(address),
                        placeId,
                        latitude,
                        longitude
                ));
            }

            return danhSach;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(
                    "Không thể tìm kiếm địa điểm. Vui lòng thử lại."
            );
        }
    }

    // =========================================================
    // PLACE DETAILS - PLACES API (NEW)
    // =========================================================

    @SuppressWarnings("unchecked")
    public PlaceDetailResponseDTO placeDetail(String placeId) {
        String id = chuanHoaChuoi(placeId);

        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("placeId không được để trống.");
        }

        kiemTraApiKey();

        try {
            String url = UriComponentsBuilder
                    .fromUriString(placesDetailsUrl + "/" + id)
                    .queryParam("languageCode", language)
                    .queryParam("regionCode", region.toUpperCase())
                    .build()
                    .encode()
                    .toUriString();

            Map<String, Object> result = restClient
                    .get()
                    .uri(url)
                    .header("X-Goog-Api-Key", apiKey)
                    .header(
                            "X-Goog-FieldMask",
                            "id,displayName,formattedAddress,location"
                    )
                    .retrieve()
                    .body(Map.class);

            if (result == null) {
                throw new IllegalArgumentException("Không tìm thấy địa điểm.");
            }

            Map<String, Object> displayName =
                    (Map<String, Object>) result.get("displayName");
            Map<String, Object> location =
                    (Map<String, Object>) result.get("location");

            if (location == null) {
                throw new IllegalArgumentException(
                        "Địa điểm chưa có tọa độ hợp lệ."
                );
            }

            Double latitude = toDouble(location.get("latitude"));
            Double longitude = toDouble(location.get("longitude"));
            kiemTraToaDo(latitude, longitude);

            return new PlaceDetailResponseDTO(
                    stringValue(result.get("id")),
                    displayName == null
                            ? null
                            : stringValue(displayName.get("text")),
                    stringValue(result.get("formattedAddress")),
                    latitude,
                    longitude
            );
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(
                    "Không thể lấy thông tin địa điểm. Vui lòng thử lại."
            );
        }
    }

    // =========================================================
    // REVERSE GEOCODE
    // =========================================================

    @SuppressWarnings("unchecked")
    public GeocodeResponseDTO reverseGeocode(
            Double latitude,
            Double longitude
    ) {
        kiemTraToaDo(latitude, longitude);

        if (apiKey == null || apiKey.isBlank()) {
            return reverseGeocodeNominatim(latitude, longitude);
        }

        try {
            String url = UriComponentsBuilder
                    .fromUriString(geocodingUrl)
                    .queryParam("latlng", latitude + "," + longitude)
                    .queryParam("key", apiKey)
                    .queryParam("language", language)
                    .build()
                    .encode()
                    .toUriString();

            Map<String, Object> response = restClient
                    .get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            kiemTraGeocodingResponse(
                    response,
                    "Không thể xác định địa chỉ của vị trí hiện tại."
            );

            List<Map<String, Object>> results =
                    (List<Map<String, Object>>) response.get("results");

            if (results == null || results.isEmpty()) {
                return reverseGeocodeNominatim(latitude, longitude);
            }

            Map<String, Object> result = results.getFirst();

            return taoGeocodeResponse(
                    result,
                    latitude,
                    longitude
            );
        } catch (Exception e) {
            return reverseGeocodeNominatim(latitude, longitude);
        }
    }

    // =========================================================
    // DISTANCE - ROUTES API
    // =========================================================

    @SuppressWarnings("unchecked")
    public DistanceResponseDTO distance(
            Double originLat,
            Double originLng,
            Double destinationLat,
            Double destinationLng
    ) {
        kiemTraToaDo(originLat, originLng);
        kiemTraToaDo(destinationLat, destinationLng);
        kiemTraApiKey();

        try {
            Map<String, Object> origin = taoWaypoint(originLat, originLng);
            Map<String, Object> destination =
                    taoWaypoint(destinationLat, destinationLng);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("origin", origin);
            body.put("destination", destination);
            body.put("travelMode", "DRIVE");
            body.put("routingPreference", "TRAFFIC_UNAWARE");
            body.put("languageCode", language);
            body.put("units", "METRIC");

            Map<String, Object> response = restClient
                    .post()
                    .uri(routesUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Goog-Api-Key", apiKey)
                    .header(
                            "X-Goog-FieldMask",
                            "routes.distanceMeters,routes.duration"
                    )
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                throw new RuntimeException(
                        "Không thể tính khoảng cách lúc này."
                );
            }

            List<Map<String, Object>> routes =
                    (List<Map<String, Object>>) response.get("routes");

            if (routes == null || routes.isEmpty()) {
                throw new RuntimeException(
                        "Không tìm thấy tuyến đường phù hợp."
                );
            }

            Map<String, Object> route = routes.getFirst();
            Double distanceMeters = toDouble(route.get("distanceMeters"));

            if (distanceMeters < 0) {
                throw new RuntimeException("Khoảng cách không hợp lệ.");
            }

            Long durationSeconds =
                    parseDurationSeconds(stringValue(route.get("duration")));

            return new DistanceResponseDTO(
                    distanceMeters,
                    formatDistance(distanceMeters),
                    durationSeconds,
                    formatDuration(durationSeconds)
            );
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(
                    "Không thể tính khoảng cách lúc này. Vui lòng thử lại."
            );
        }
    }

    private Map<String, Object> taoWaypoint(Double latitude, Double longitude) {
        Map<String, Object> latLng = new LinkedHashMap<>();
        latLng.put("latitude", latitude);
        latLng.put("longitude", longitude);

        Map<String, Object> location = new LinkedHashMap<>();
        location.put("latLng", latLng);

        Map<String, Object> waypoint = new LinkedHashMap<>();
        waypoint.put("location", location);
        return waypoint;
    }

    // =========================================================
    // OPENSTREETMAP / NOMINATIM FALLBACK
    // =========================================================

    // Reverse lookup through the backend: browsers do not call Nominatim directly.
    @SuppressWarnings("unchecked")
    private GeocodeResponseDTO reverseGeocodeNominatim(Double latitude, Double longitude) {
        try {
            String reverseUrl = nominatimUrl.replaceAll("/search/?$", "/reverse");
            String url = UriComponentsBuilder.fromUriString(reverseUrl)
                    .queryParam("lat", latitude).queryParam("lon", longitude)
                    .queryParam("format", "jsonv2").queryParam("addressdetails", 1)
                    .queryParam("accept-language", language)
                    .build().encode().toUriString();
            Map<String, Object> result = restClient.get().uri(url)
                    .header("User-Agent", "TAKIVIVU/1.0 (student-project)")
                    .retrieve().body(Map.class);
            if (result == null || result.containsKey("error"))
                throw new IllegalArgumentException("Không tìm thấy địa chỉ tại điểm đã chọn.");
            Map<String, Object> address = result.get("address") instanceof Map<?, ?> raw
                    ? (Map<String, Object>) raw : Map.of();
            String city = chuanHoaThanhPho(firstNonBlank(address,
                    "city", "municipality", "town", "village", "state"));
            String district = chuanHoaQuanHuyen(firstNonBlank(address,
                    "city_district", "district", "county", "suburb"));
            String house = stringValue(address.get("house_number"));
            String road = firstNonBlank(address, "road", "pedestrian", "residential", "path", "neighbourhood");
            String specific = ((house == null ? "" : house + " ") + (road == null ? "" : road)).trim();
            if (specific.isBlank()) specific = stringValue(result.get("display_name"));
            return new GeocodeResponseDTO(stringValue(result.get("display_name")),
                    latitude, longitude, "osm:" + stringValue(result.get("osm_id")),
                    city, district, specific);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy địa chỉ từ bản đồ. Kiểm tra kết nối Internet của Map Service.", e);
        }
    }

    @SuppressWarnings("unchecked")
    private GeocodeResponseDTO geocodeNominatim(String query) {
        try {
            String url = UriComponentsBuilder
                    .fromUriString(nominatimUrl)
                    .queryParam("q", query)
                    .queryParam("format", "jsonv2")
                    .queryParam("addressdetails", 1)
                    .queryParam("limit", 1)
                    .queryParam("countrycodes", "vn")
                    .queryParam("accept-language", language)
                    .build()
                    .encode()
                    .toUriString();

            List<Map<String, Object>> results = restClient
                    .get()
                    .uri(url)
                    .header("User-Agent", "TAKIVIVU/1.0 (student-project)")
                    .retrieve()
                    .body(List.class);

            if (results == null || results.isEmpty()) {
                throw new IllegalArgumentException("Không tìm thấy địa chỉ phù hợp. Hãy nhập rõ quận/huyện và thành phố.");
            }

            Map<String, Object> first = results.getFirst();
            Double latitude = toDouble(first.get("lat"));
            Double longitude = toDouble(first.get("lon"));
            kiemTraToaDo(latitude, longitude);

            Map<String, Object> address = first.get("address") instanceof Map<?, ?> raw
                    ? (Map<String, Object>) raw
                    : Map.of();

            String city = firstNonBlank(address,
                    "city", "municipality", "town", "village", "state");
            String district = firstNonBlank(address,
                    "city_district", "district", "county", "suburb");

            city = chuanHoaThanhPho(city);
            district = chuanHoaQuanHuyen(district);

            List<String> specificParts = new ArrayList<>();
            String houseNumber = stringValue(address.get("house_number"));
            String road = firstNonBlank(address, "road", "pedestrian", "residential", "path");
            String neighbourhood = firstNonBlank(address, "neighbourhood", "quarter");
            String street = ((houseNumber == null ? "" : houseNumber + " ") + (road == null ? "" : road)).trim();
            if (!street.isBlank()) specificParts.add(street);
            if (neighbourhood != null && !neighbourhood.isBlank()) specificParts.add(neighbourhood);

            String specificAddress = String.join(", ", specificParts);
            if (specificAddress.isBlank()) {
                specificAddress = district != null ? district : stringValue(first.get("name"));
            }

            String displayName = stringValue(first.get("display_name"));
            String osmId = stringValue(first.get("osm_id"));

            return new GeocodeResponseDTO(
                    displayName,
                    latitude,
                    longitude,
                    osmId == null ? null : "osm:" + osmId,
                    city,
                    district,
                    specificAddress
            );
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Không thể tìm địa chỉ trên bản đồ lúc này. Vui lòng thử lại.");
        }
    }

    private String firstNonBlank(Map<String, Object> values, String... keys) {
        for (String key : keys) {
            String value = stringValue(values.get(key));
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    // =========================================================
    // VALIDATION
    // =========================================================

    private void kiemTraToaDo(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException(
                    "Latitude và Longitude không được để trống."
            );
        }

        if (latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException(
                    "Latitude phải nằm trong khoảng -90 đến 90."
            );
        }

        if (longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException(
                    "Longitude phải nằm trong khoảng -180 đến 180."
            );
        }
    }

    private void kiemTraApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException(
                    "Google Maps API Key chưa được cấu hình."
            );
        }
    }

    private void kiemTraGeocodingResponse(
            Map<String, Object> response,
            String errorMessage
    ) {
        if (response == null) {
            throw new RuntimeException(errorMessage);
        }

        String status = stringValue(response.get("status"));

        if ("ZERO_RESULTS".equals(status)) {
            return;
        }

        if (!"OK".equals(status)) {
            String googleMessage = stringValue(response.get("error_message"));
            if (googleMessage != null && !googleMessage.isBlank()) {
                System.err.println("[GOOGLE MAPS] " + status + ": " + googleMessage);
            }
            throw new RuntimeException(errorMessage);
        }
    }

    // =========================================================
    // UTIL
    // =========================================================

    private String chuanHoaChuoi(String value) {
        if (value == null) {
            return null;
        }
        return value.trim().replaceAll("\\s+", " ");
    }

    private String stringValue(Object value) {
        return value == null ? null : value.toString();
    }

    private Double toDouble(Object value) {
        if (value == null) {
            throw new IllegalArgumentException("Tọa độ không hợp lệ.");
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return Double.valueOf(value.toString());
    }

    private Double toDoubleNullable(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.valueOf(value.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private Long parseDurationSeconds(String duration) {
        if (duration == null || duration.isBlank()) {
            return null;
        }

        try {
            String value = duration.endsWith("s")
                    ? duration.substring(0, duration.length() - 1)
                    : duration;
            return Math.round(Double.parseDouble(value));
        } catch (Exception e) {
            return null;
        }
    }

    private String formatDistance(Double meters) {
        if (meters == null) {
            return null;
        }
        if (meters >= 1000) {
            return String.format(java.util.Locale.US, "%.1f km", meters / 1000.0);
        }
        return Math.round(meters) + " m";
    }

    private String formatDuration(Long seconds) {
        if (seconds == null) {
            return null;
        }
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;

        if (hours > 0 && minutes > 0) {
            return hours + " giờ " + minutes + " phút";
        }
        if (hours > 0) {
            return hours + " giờ";
        }
        return Math.max(minutes, 1) + " phút";
    }

    @SuppressWarnings("unchecked")
    private GeocodeResponseDTO taoGeocodeResponse(
            Map<String, Object> result,
            Double latitude,
            Double longitude
    ) {
        String formattedAddress = stringValue(result.get("formatted_address"));
        String city = null;
        String district = null;
        String route = null;
        String streetNumber = null;
        String premise = null;
        String sublocality = null;

        Object rawComponents = result.get("address_components");
        if (rawComponents instanceof List<?> components) {
            for (Object raw : components) {
                if (!(raw instanceof Map<?, ?> map)) {
                    continue;
                }
                String longName = stringValue(map.get("long_name"));
                Object rawTypes = map.get("types");
                List<String> types = rawTypes instanceof List<?> list
                        ? list.stream().map(String::valueOf).toList()
                        : List.of();

                if (types.contains("administrative_area_level_1") && city == null) {
                    city = longName;
                }
                if ((types.contains("administrative_area_level_2") || types.contains("sublocality_level_1")) && district == null) {
                    district = longName;
                }
                if (types.contains("route") && route == null) {
                    route = longName;
                }
                if (types.contains("street_number") && streetNumber == null) {
                    streetNumber = longName;
                }
                if ((types.contains("premise") || types.contains("establishment")) && premise == null) {
                    premise = longName;
                }
                if (types.contains("sublocality_level_2") && sublocality == null) {
                    sublocality = longName;
                }
            }
        }

        city = chuanHoaThanhPho(city);
        district = chuanHoaQuanHuyen(district);

        List<String> specificParts = new ArrayList<>();
        if (premise != null && !premise.isBlank()) specificParts.add(premise);
        String street = ((streetNumber == null ? "" : streetNumber + " ") + (route == null ? "" : route)).trim();
        if (!street.isBlank()) specificParts.add(street);
        if (sublocality != null && !sublocality.isBlank()) specificParts.add(sublocality);
        String specificAddress = String.join(", ", specificParts);
        if (specificAddress.isBlank()) {
            specificAddress = district != null ? district : formattedAddress;
        }

        return new GeocodeResponseDTO(
                formattedAddress,
                latitude,
                longitude,
                stringValue(result.get("place_id")),
                city,
                district,
                specificAddress
        );
    }

    private GeocodeResponseDTO taoGeocodeResponseTuChuoi(
            String address,
            Double latitude,
            Double longitude,
            String placeId
    ) {
        String[] raw = address == null ? new String[0] : address.split(",");
        List<String> parts = new ArrayList<>();
        for (String value : raw) {
            String part = value.trim();
            if (!part.isBlank() && !"Việt Nam".equalsIgnoreCase(part) && !"Vietnam".equalsIgnoreCase(part)) {
                parts.add(part);
            }
        }

        String city = parts.isEmpty() ? null : chuanHoaThanhPho(parts.get(parts.size() - 1));
        String district = parts.size() >= 2 ? chuanHoaQuanHuyen(parts.get(parts.size() - 2)) : null;
        String specificAddress;
        if (parts.size() >= 3) {
            specificAddress = String.join(", ", parts.subList(0, parts.size() - 2));
        } else if (district != null) {
            specificAddress = district;
        } else {
            specificAddress = address;
        }

        return new GeocodeResponseDTO(
                address,
                latitude,
                longitude,
                placeId,
                city,
                district,
                specificAddress
        );
    }

    private String chuanHoaThanhPho(String value) {
        if (value == null) return null;
        String city = value.trim();
        if (city.equalsIgnoreCase("Thành phố Hà Nội") || city.equalsIgnoreCase("Hanoi")) return "Hà Nội";
        if (city.equalsIgnoreCase("Thành phố Hồ Chí Minh") || city.equalsIgnoreCase("Ho Chi Minh City") || city.equalsIgnoreCase("Hồ Chí Minh")) return "TP. Hồ Chí Minh";
        if (city.equalsIgnoreCase("Da Nang")) return "Đà Nẵng";
        if (city.startsWith("Tỉnh ")) return city.substring(5).trim();
        if (city.startsWith("Thành phố ")) return city.substring(10).trim();
        return city;
    }

    private String chuanHoaQuanHuyen(String value) {
        if (value == null) return null;
        String district = value.trim();
        for (String prefix : List.of("Quận ", "Huyện ", "Thị xã ", "Thành phố ")) {
            if (district.startsWith(prefix)) {
                return district.substring(prefix.length()).trim();
            }
        }
        return district;
    }

    private String layKhuVuc(String address) {
        if (address == null || address.isBlank()) {
            return null;
        }

        String[] parts = address.split(",");
        if (parts.length >= 2) {
            return parts[parts.length - 2].trim();
        }
        return address;
    }
}
