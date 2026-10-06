package com.example.hotelservice.controller;

import com.example.hotelservice.entity.DanhGiaKhachSan;
import com.example.hotelservice.entity.KhachSan;
import com.example.hotelservice.repository.DanhGiaKhachSanRepository;
import com.example.hotelservice.repository.KhachSanRepository;
import com.example.hotelservice.repository.PhysicalRoomHoldRepository;
import com.example.hotelservice.repository.PhongCuTheRepository;
import java.time.LocalDate;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/hotels/reviews")
public class HotelReviewController {
 private final DanhGiaKhachSanRepository reviews; private final KhachSanRepository targets; private final PhysicalRoomHoldRepository holds; private final PhongCuTheRepository rooms;
 public HotelReviewController(DanhGiaKhachSanRepository reviews,KhachSanRepository targets,PhysicalRoomHoldRepository holds,PhongCuTheRepository rooms){this.reviews=reviews;this.targets=targets;this.holds=holds;this.rooms=rooms;}
 public record ReviewRequest(Long bookingId,Long targetId,Integer soSao,String noiDung){}
 @GetMapping("/me") public List<DanhGiaKhachSan> mine(Authentication a){return reviews.findByUserIdOrderByNgayTaoDesc(uid(a));}
 @GetMapping("/target/{id}") public List<DanhGiaKhachSan> target(@PathVariable Long id){return reviews.findByTargetIdOrderByNgayTaoDesc(id);}
 @GetMapping("/booking/{bookingId}/target/{targetId}") public ResponseEntity<DanhGiaKhachSan> booking(@PathVariable Long bookingId,@PathVariable Long targetId,Authentication a){return reviews.findByBookingIdAndTargetId(bookingId,targetId).filter(x->Objects.equals(x.getUserId(),uid(a))).map(ResponseEntity::ok).orElseGet(()->ResponseEntity.notFound().build());}
 @GetMapping("/provider") public List<DanhGiaKhachSan> provider(Authentication a){long provider=uid(a); return reviews.findAll().stream().filter(r->targets.findById(r.getTargetId()).map(t->Objects.equals(t.getNhaCungCapId(),provider)).orElse(false)).sorted(Comparator.comparing(DanhGiaKhachSan::getNgayTao,Comparator.nullsLast(Comparator.reverseOrder()))).toList();}
 @PostMapping public ResponseEntity<?> create(@RequestBody ReviewRequest req,Authentication a){
   if(req.bookingId()==null||req.targetId()==null||req.soSao()==null||req.soSao()<1||req.soSao()>5)return ResponseEntity.badRequest().body(Map.of("message","Số sao phải từ 1 đến 5."));
   if(!targets.existsById(req.targetId()))return ResponseEntity.badRequest().body(Map.of("message","Dịch vụ đánh giá không tồn tại."));
   if(reviews.findByBookingIdAndTargetId(req.bookingId(),req.targetId()).isPresent())return ResponseEntity.status(409).body(Map.of("message","Dịch vụ này trong đơn đã được đánh giá."));
   var bookingHolds=holds.findByBookingId(req.bookingId());
   if(bookingHolds.isEmpty())return ResponseEntity.status(403).body(Map.of("message","Không tìm thấy lượt lưu trú của đơn này."));
   boolean sameHotel=bookingHolds.stream().allMatch(h->rooms.findById(h.getPhongCuTheId()).map(r->Objects.equals(r.getKhachSanId(),req.targetId())).orElse(false));
   if(!sameHotel)return ResponseEntity.status(403).body(Map.of("message","Đơn không thuộc khách sạn đang đánh giá."));
   LocalDate checkout=bookingHolds.stream().map(h->h.getNgayTraPhong()).max(LocalDate::compareTo).orElse(null);
   if(checkout==null || LocalDate.now().isBefore(checkout))return ResponseEntity.status(403).body(Map.of("message","Chỉ được đánh giá sau khi đã trả phòng."));
   DanhGiaKhachSan r=new DanhGiaKhachSan(); r.setUserId(uid(a));r.setBookingId(req.bookingId());r.setTargetId(req.targetId());r.setSoSao(req.soSao());r.setNoiDung(req.noiDung()==null?"":req.noiDung().trim());return ResponseEntity.status(201).body(reviews.save(r));
 }
 private long uid(Authentication a){if(a==null||!(a.getDetails() instanceof Number n))throw new RuntimeException("Người dùng chưa đăng nhập");return n.longValue();}
}
