package com.example.flightservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "flight_holds")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlightHold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(
            name = "chuyen_bay_id",
            referencedColumnName = "id",
            nullable = false
    )
    private Flight chuyenBay;

    @Column(
            name = "booking_id",
            nullable = false
    )
    private Long bookingId;

    @Column(
            name = "so_luong_ghe",
            nullable = false
    )
    private Integer soLuongGhe;



    @Column(
            name = "seat_codes",
            columnDefinition = "TEXT"
    )
    private String seatCodes;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "trang_thai",
            nullable = false
    )
    private TrangThaiHold trangThai;

    @Column(
            name = "het_han_luc",
            nullable = false
    )
    private LocalDateTime hetHanLuc;

    @Column(
            name = "ngay_tao",
            insertable = false,
            updatable = false
    )
    private LocalDateTime ngayTao;

    @Column(
            name = "ngay_cap_nhat",
            insertable = false,
            updatable = false
    )
    private LocalDateTime ngayCapNhat;
}