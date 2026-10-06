package com.example.flightservice.controller;
import com.example.flightservice.entity.DanhGiaChuyenBay;
import com.example.flightservice.repository.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
@RestController @RequestMapping("/api/flights/reviews")
public class FlightReviewController {
 private final DanhGiaChuyenBayRepository reviews; private final FlightRepository targets; private final FlightHoldRepository holds;
 public FlightReviewController(DanhGiaChuyenBayRepository reviews,FlightRepository targets,FlightHoldRepository holds){this.reviews=reviews;this.targets=targets;this.holds=holds;}
 public record ReviewRequest(Long bookingId,Long targetId,Integer soSao,String noiDung){}
 @GetMapping("/me") public List<DanhGiaChuyenBay> mine(Authentication a){return reviews.findByUserIdOrderByNgayTaoDesc(uid(a));}
 @GetMapping("/target/{id}") public List<DanhGiaChuyenBay> target(@PathVariable Long id){return reviews.findByTargetIdOrderByNgayTaoDesc(id);}
 @GetMapping("/booking/{bookingId}/target/{targetId}") public ResponseEntity<DanhGiaChuyenBay> booking(@PathVariable Long bookingId,@PathVariable Long targetId,Authentication a){return reviews.findByBookingIdAndTargetId(bookingId,targetId).filter(x->Objects.equals(x.getUserId(),uid(a))).map(ResponseEntity::ok).orElseGet(()->ResponseEntity.notFound().build());}
 @GetMapping("/provider") public List<DanhGiaChuyenBay> provider(Authentication a){long provider=uid(a);return reviews.findAll().stream().filter(r->targets.findById(r.getTargetId()).map(t->Objects.equals(t.getNhaCungCapId(),provider)).orElse(false)).sorted(Comparator.comparing(DanhGiaChuyenBay::getNgayTao,Comparator.nullsLast(Comparator.reverseOrder()))).toList();}
 @PostMapping public ResponseEntity<?> create(@RequestBody ReviewRequest req,Authentication a){
  if(req.bookingId()==null||req.targetId()==null||req.soSao()==null||req.soSao()<1||req.soSao()>5)return ResponseEntity.badRequest().body(Map.of("message","Số sao phải từ 1 đến 5."));
  var flight=targets.findById(req.targetId()).orElse(null); if(flight==null)return ResponseEntity.badRequest().body(Map.of("message","Chuyến bay không tồn tại."));
  if(reviews.findByBookingIdAndTargetId(req.bookingId(),req.targetId()).isPresent())return ResponseEntity.status(409).body(Map.of("message","Dịch vụ này trong đơn đã được đánh giá."));
  boolean belongs=holds.findByBookingId(req.bookingId()).stream().anyMatch(h->Objects.equals(h.getChuyenBay().getId(),req.targetId()));
  if(!belongs)return ResponseEntity.status(403).body(Map.of("message","Đơn không thuộc chuyến bay đang đánh giá."));
  if(LocalDateTime.now().isBefore(flight.getThoiGianDen()))return ResponseEntity.status(403).body(Map.of("message","Chỉ được đánh giá sau khi chuyến bay kết thúc."));
  DanhGiaChuyenBay r=new DanhGiaChuyenBay();r.setUserId(uid(a));r.setBookingId(req.bookingId());r.setTargetId(req.targetId());r.setSoSao(req.soSao());r.setNoiDung(req.noiDung()==null?"":req.noiDung().trim());return ResponseEntity.status(201).body(reviews.save(r));
 }
 private long uid(Authentication a){if(a==null||!(a.getDetails() instanceof Number n))throw new RuntimeException("Người dùng chưa đăng nhập");return n.longValue();}
}
