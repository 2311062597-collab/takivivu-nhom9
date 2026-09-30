package com.example.flightservice.repository;
import com.example.flightservice.entity.FlightSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface FlightSeatRepository extends JpaRepository<FlightSeat,Long>{
    List<FlightSeat> findByFlightIdOrderById(Long flightId);
    List<FlightSeat> findByFlightIdAndMaGheIn(Long flightId, List<String> maGhe);
    void deleteByFlightId(Long flightId);
}
