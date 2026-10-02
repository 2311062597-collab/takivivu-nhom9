package com.example.flightservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class FlightInventoryDTO {
    private Long flightId;
    private List<Fare> fares;
    private List<Seat> seats;

    @Data @AllArgsConstructor
    public static class Fare {
        private Long id;
        private String hangVe;
        private BigDecimal giaVe;
        private Integer soGhe;
        private Integer soGheConLai;
    }
    @Data @AllArgsConstructor
    public static class Seat {
        private Long id;
        private String maGhe;
        private String hangVe;
        private String trangThai;
    }
}
