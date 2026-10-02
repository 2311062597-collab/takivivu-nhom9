package com.example.flightservice.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="flight_seats", uniqueConstraints=@UniqueConstraint(name="uq_flight_seat_code", columnNames={"flight_id","ma_ghe"}))
@Data @NoArgsConstructor @AllArgsConstructor
public class FlightSeat {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="flight_id",nullable=false) @ToString.Exclude @EqualsAndHashCode.Exclude private Flight flight;
 @Column(name="ma_ghe",nullable=false,length=10) private String maGhe;
 @Column(name="hang_ve",nullable=false,length=50) private String hangVe;
 @Column(name="trang_thai",nullable=false,length=20) private String trangThai="AVAILABLE";
}
