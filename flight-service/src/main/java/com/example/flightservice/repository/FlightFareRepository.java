package com.example.flightservice.repository;
import com.example.flightservice.entity.FlightFare;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface FlightFareRepository extends JpaRepository<FlightFare,Long>{
    List<FlightFare> findByFlightIdOrderById(Long flightId);
    Optional<FlightFare> findByFlightIdAndHangVe(Long flightId, String hangVe);
    void deleteByFlightId(Long flightId);
}
