package com.example.hotelservice.controller;
import com.example.hotelservice.dto.*;
import com.example.hotelservice.entity.*;
import com.example.hotelservice.service.HotelRoomManagementService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/hotels/provider") public class HotelRoomManagementController {
 private final HotelRoomManagementService service;
 public HotelRoomManagementController(HotelRoomManagementService service){this.service=service;}
 private Long user(Authentication a){if(a==null||a.getAuthorities().stream().noneMatch(x->x.getAuthority().equals("ROLE_PROVIDER"))||!(a.getDetails() instanceof Long))throw new IllegalArgumentException("Yêu cầu đăng nhập nhà cung cấp");return (Long)a.getDetails();}
 @GetMapping("/room-types") public List<LoaiPhong> types(Authentication a){return service.types(user(a));}
 @PostMapping("/room-types") public ResponseEntity<LoaiPhong> addType(Authentication a,@Valid @RequestBody LoaiPhongRequest r){return ResponseEntity.status(201).body(service.saveType(user(a),null,r));}
 @PutMapping("/room-types/{id}") public LoaiPhong editType(Authentication a,@PathVariable Long id,@Valid @RequestBody LoaiPhongRequest r){return service.saveType(user(a),id,r);}
 @DeleteMapping("/room-types/{id}") public ResponseEntity<Void> delType(Authentication a,@PathVariable Long id){service.deleteType(user(a),id);return ResponseEntity.noContent().build();}
 @GetMapping("/physical-rooms") public List<PhongCuThe> rooms(Authentication a){return service.rooms(user(a));}
 @PostMapping("/physical-rooms") public ResponseEntity<PhongCuThe> addRoom(Authentication a,@Valid @RequestBody PhongCuTheRequest r){return ResponseEntity.status(201).body(service.saveRoom(user(a),null,r));}
 @PutMapping("/physical-rooms/{id}") public PhongCuThe editRoom(Authentication a,@PathVariable Long id,@Valid @RequestBody PhongCuTheRequest r){return service.saveRoom(user(a),id,r);}
 @DeleteMapping("/physical-rooms/{id}") public ResponseEntity<Void> delRoom(Authentication a,@PathVariable Long id){service.deleteRoom(user(a),id);return ResponseEntity.noContent().build();}
}