package com.example.attractionservice.controller;

import com.example.attractionservice.entity.DanhGiaDiaDiem;
import com.example.attractionservice.entity.DiaDiemThamQuan;
import com.example.attractionservice.repository.DanhGiaDiaDiemRepository;
import com.example.attractionservice.repository.DiaDiemThamQuanRepository;
import com.example.attractionservice.repository.GiuVeThamQuanRepository;
import java.time.LocalDate;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/attractions/reviews")
public class AttractionReviewController {
 private final DanhGiaDiaDiemRepository reviews; private final DiaDiemThamQuanRepository targets; private final GiuVeThamQuanRepository holds;
 public AttractionReviewController(DanhGiaDiaDiemRepository reviews,DiaDiemThamQuanRepository targets,GiuVeThamQuanRepository holds){this.reviews=reviews;this.targets=targets;this.holds=holds;}
 public record ReviewRequest(Long bookingId,Long targetId,Integer soSao,String noiDung){}
 @GetMapping("/me") public List<DanhGiaDiaDiem> mine(Authentication a){return reviews.findByUserIdOrderByNgayTaoDesc(uid(a));}
 @GetMapping("/target/{id}") public List<DanhGiaDiaDiem> target(@PathVariable Long id){return reviews.findByTargetIdOrderByNgayTaoDesc(id);}
 @GetMapping("/booking/{bookingId}/target/{targetId}") public ResponseEntity<DanhGiaDiaDiem> booking(@PathVariable Long bookingId,@PathVariable Long targetId,Authentication a){return reviews.findByBookingIdAndTargetId(bookingId,targetId).filter(x->Objects.equals(x.getUserId(),uid(a))).map(ResponseEntity::ok).orElseGet(()->ResponseEntity.notFound().build());}
 @GetMapping("/provider") public List<DanhGiaDiaDiem> provider(Authentication a){long provider=uid(a); return reviews.findAll().stream().filter(r->targets.findById(r.getTargetId()).map(t->Objects.equals(t.getNhaCungCapId(),provider)).orElse(false)).sorted(Comparator.comparing(DanhGiaDiaDiem::getNgayTao,Comparator.nullsLast(Comparator.reverseOrder()))).toList();}
 @PostMapping public ResponseEntity<?> create(@RequestBody ReviewRequest req,Authentication a){
   if(req.bookingId()==null||req.targetId()==null||req.soSao()==null||req.soSao()<1||req.soSao()>5)return ResponseEntity.badRequest().body(Map.of("message","Số sao phải từ 1 đến 5."));
   if(!targets.existsById(req.targetId()))return ResponseEntity.badRequest().body(Map.of("message","Dịch vụ đánh giá không tồn tại."));
   if(reviews.findByBookingIdAndTargetId(req.bookingId(),req.targetId()).isPresent())return ResponseEntity.status(409).body(Map.of("message","Dịch vụ này trong đơn đã được đánh giá."));
   var bookingHolds=holds.findByBookingId(req.bookingId());
   if(bookingHolds.isEmpty())return ResponseEntity.status(403).body(Map.of("message","Không tìm thấy vé của đơn này."));
   boolean sameAttraction=bookingHolds.stream().allMatch(h->Objects.equals(h.getLoaiVe().getDiaDiem().getId(),req.targetId()));
   if(!sameAttraction)return ResponseEntity.status(403).body(Map.of("message","Đơn không thuộc địa điểm đang đánh giá."));
   LocalDate lastUse=bookingHolds.stream().map(h->h.getNgaySuDung()).max(LocalDate::compareTo).orElse(null);
   if(lastUse==null || !LocalDate.now().isAfter(lastUse))return ResponseEntity.status(403).body(Map.of("message","Chỉ được đánh giá sau khi vé đã hết ngày sử dụng."));
   DanhGiaDiaDiem r=new DanhGiaDiaDiem(); r.setUserId(uid(a));r.setBookingId(req.bookingId());r.setTargetId(req.targetId());r.setSoSao(req.soSao());r.setNoiDung(req.noiDung()==null?"":req.noiDung().trim());return ResponseEntity.status(201).body(reviews.save(r));
 }
 private long uid(Authentication a){if(a==null||!(a.getDetails() instanceof Number n))throw new RuntimeException("Người dùng chưa đăng nhập");return n.longValue();}
}
