package com.example.flightservice.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
@Entity @Table(name="flight_fares", uniqueConstraints=@UniqueConstraint(name="uq_flight_fare_class", columnNames={"flight_id","hang_ve"}))
@Data @NoArgsConstructor @AllArgsConstructor
public class FlightFare {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="flight_id",nullable=false) @ToString.Exclude @EqualsAndHashCode.Exclude private Flight flight;
 @Column(name="hang_ve",nullable=false,length=50) private String hangVe;
 @Column(name="gia_ve",nullable=false,precision=15,scale=2) private BigDecimal giaVe;
 @Column(name="so_ghe",nullable=false) private Integer soGhe;
 @Column(name="so_ghe_con_lai",nullable=false) private Integer soGheConLai;
}
