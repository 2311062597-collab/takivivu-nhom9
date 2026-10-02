package com.example.hotelservice.service;
import com.example.hotelservice.entity.*;
import com.example.hotelservice.dto.*;
import com.example.hotelservice.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
@Service public class PhysicalBookingService {
 private final LoaiPhongRepository types; private final PhongCuTheRepository rooms; private final PhysicalRoomHoldRepository holds; private final KhachSanRepository hotels;
 public PhysicalBookingService(LoaiPhongRepository t,PhongCuTheRepository r,PhysicalRoomHoldRepository h,KhachSanRepository k){types=t;rooms=r;holds=h;hotels=k;}
 public List<PhongCuThe> available(Long typeId,LocalDate start,LocalDate end){
  if(start==null||end==null||end.isBefore(start.plusDays(1)))throw new IllegalArgumentException("Khoảng ngày không hợp lệ");
  LoaiPhong t=types.findById(typeId).orElseThrow(()->new IllegalArgumentException("Không tìm thấy loại phòng"));
  if(!Boolean.TRUE.equals(t.getDangKinhDoanh()) || hotels.findById(t.getKhachSanId()).filter(k->k.getTrangThai()==TrangThaiKhachSan.ACTIVE).isEmpty())return List.of();
  return rooms.findByKhachSanIdOrderByTangAscSoPhongAsc(t.getKhachSanId()).stream().filter(r->r.getLoaiPhongId().equals(typeId)&&Boolean.TRUE.equals(r.getDangHoatDong())&&holds.overlapping(r.getId(),start,end,LocalDateTime.now()).isEmpty()).toList();
 }
 public boolean occupied(Long roomId,LocalDate start,LocalDate end){return !holds.overlapping(roomId,start,end,LocalDateTime.now()).isEmpty();}
 @Transactional public GiuPhongResponseDTO hold(Long typeId,GiuPhongRequestDTO req){
  if(req.getNgayNhanPhong()==null||req.getNgayNhanPhong().isBefore(LocalDate.now())||req.getNgayTraPhong()==null||!req.getNgayTraPhong().isAfter(req.getNgayNhanPhong()))throw new IllegalArgumentException("Ngày nhận/trả phòng không hợp lệ");
  if(req.getSoLuongPhong()==null||req.getSoLuongPhong()<1)throw new IllegalArgumentException("Số lượng phòng không hợp lệ");
  if(req.getBookingId()==null)throw new IllegalArgumentException("Thiếu mã booking");
  LoaiPhong lockedType=types.locked(typeId).orElseThrow(()->new IllegalArgumentException("Không tìm thấy loại phòng"));
  if(!Boolean.TRUE.equals(lockedType.getDangKinhDoanh()))throw new IllegalArgumentException("Loại phòng đã ngừng kinh doanh");
  if(hotels.findById(lockedType.getKhachSanId()).filter(k->k.getTrangThai()==TrangThaiKhachSan.ACTIVE).isEmpty())throw new IllegalArgumentException("Khách sạn không hoạt động");
  List<PhysicalRoomHold> existing=holds.findByBookingId(req.getBookingId());
  LocalDateTime now=LocalDateTime.now();
  // A booking can contain several distinct physical rooms. Reject a repeated room,
  // but do not reject the entire booking simply because an earlier item has a hold.
  existing.stream().filter(h->h.getTrangThai()==TrangThaiGiuPhong.HOLDING && !h.getHetHanLuc().isAfter(now))
      .forEach(h->h.setTrangThai(TrangThaiGiuPhong.EXPIRED));
  holds.saveAll(existing);
  if(req.getPhongCuTheId()!=null && existing.stream().anyMatch(h->h.getPhongCuTheId().equals(req.getPhongCuTheId()) &&
       (h.getTrangThai()==TrangThaiGiuPhong.CONFIRMED || (h.getTrangThai()==TrangThaiGiuPhong.HOLDING && h.getHetHanLuc().isAfter(now)))))
   throw new IllegalArgumentException("Phòng này đã được thêm vào đơn đặt phòng");
  List<PhongCuThe> free=available(typeId,req.getNgayNhanPhong(),req.getNgayTraPhong());
  Set<Long> alreadyHeld= new HashSet<>();
  for(PhysicalRoomHold h:existing) if(h.getTrangThai()==TrangThaiGiuPhong.CONFIRMED || (h.getTrangThai()==TrangThaiGiuPhong.HOLDING && h.getHetHanLuc().isAfter(now))) alreadyHeld.add(h.getPhongCuTheId());
  free=free.stream().filter(r->!alreadyHeld.contains(r.getId())).toList();
  if(free.size()<req.getSoLuongPhong())throw new IllegalArgumentException("Không đủ phòng trống trong khoảng ngày đã chọn");
  if(req.getPhongCuTheId()!=null){
   if(req.getSoLuongPhong()!=1)throw new IllegalArgumentException("Chọn phòng cụ thể chỉ hỗ trợ một phòng mỗi lần đặt");
   free=free.stream().filter(r->r.getId().equals(req.getPhongCuTheId())).toList();
   if(free.isEmpty())throw new IllegalArgumentException("Phòng cụ thể đã chọn không còn trống hoặc không thuộc loại phòng này");
  }
  PhysicalRoomHold first=null;
  for(PhongCuThe room:free.subList(0,req.getSoLuongPhong())){PhysicalRoomHold h=new PhysicalRoomHold();h.setPhongCuTheId(room.getId());h.setBookingId(req.getBookingId());h.setNgayNhanPhong(req.getNgayNhanPhong());h.setNgayTraPhong(req.getNgayTraPhong());h.setTrangThai(TrangThaiGiuPhong.HOLDING);h.setHetHanLuc(LocalDateTime.now().plusMinutes(15));h=holds.save(h);if(first==null)first=h;}
  return response(first,req.getSoLuongPhong(),"Giữ phòng thành công");
 }
 public boolean hasBooking(Long bookingId){LocalDateTime now=LocalDateTime.now();return holds.findByBookingId(bookingId).stream().anyMatch(h->h.getTrangThai()==TrangThaiGiuPhong.CONFIRMED || (h.getTrangThai()==TrangThaiGiuPhong.HOLDING && h.getHetHanLuc().isAfter(now)));}
 /** Only current active holds are eligible; historical expired/released rows are audit records. */
 @Transactional public GiuPhongResponseDTO confirm(Long bookingId){
  List<PhysicalRoomHold> all=holds.findByBookingId(bookingId);
  LocalDateTime now=LocalDateTime.now();
  if(all.stream().anyMatch(h->h.getTrangThai()==TrangThaiGiuPhong.CONFIRMED))
   throw new IllegalArgumentException("Booking đã được xác nhận");
  List<PhysicalRoomHold> active=all.stream().filter(h->h.getTrangThai()==TrangThaiGiuPhong.HOLDING && h.getHetHanLuc().isAfter(now)).toList();
  if(active.isEmpty())throw new IllegalArgumentException("Không có phòng đang giữ còn hiệu lực");
  // Never confirm an incomplete group: all current holding rows must still be valid.
  if(all.stream().anyMatch(h->h.getTrangThai()==TrangThaiGiuPhong.HOLDING && !h.getHetHanLuc().isAfter(now)))
   throw new IllegalArgumentException("Một hoặc nhiều phòng đang giữ đã hết hạn");
  active.forEach(h->h.setTrangThai(TrangThaiGiuPhong.CONFIRMED));
  holds.saveAll(active);
  return response(active.get(0),active.size(),"Xác nhận giữ phòng thành công");
 }
 @Transactional public GiuPhongResponseDTO release(Long bookingId){
  List<PhysicalRoomHold> all=holds.findByBookingId(bookingId);
  if(all.stream().anyMatch(h->h.getTrangThai()==TrangThaiGiuPhong.CONFIRMED))
   throw new IllegalArgumentException("Không thể giải phóng phòng đã xác nhận");
  List<PhysicalRoomHold> active=all.stream().filter(h->h.getTrangThai()==TrangThaiGiuPhong.HOLDING).toList();
  if(active.isEmpty())return response(all.get(0),all.size(),"Phòng đã giải phóng");
  active.forEach(h->h.setTrangThai(TrangThaiGiuPhong.RELEASED));
  holds.saveAll(active);
  return response(active.get(0),active.size(),"Giải phóng phòng thành công");
 }
 /** Only the internal refund workflow may free confirmed rooms. */
 @Transactional public GiuPhongResponseDTO releaseForRefund(Long bookingId){
  List<PhysicalRoomHold> all=holds.findByBookingId(bookingId);
  List<PhysicalRoomHold> active=all.stream().filter(h->h.getTrangThai()==TrangThaiGiuPhong.CONFIRMED || h.getTrangThai()==TrangThaiGiuPhong.HOLDING).toList();
  if(active.isEmpty())return response(all.get(0),all.size(),"Phòng đã giải phóng");
  active.forEach(h->h.setTrangThai(TrangThaiGiuPhong.RELEASED));
  holds.saveAll(active);
  return response(active.get(0),active.size(),"Giải phóng phòng theo yêu cầu hoàn tiền");
 }
 private GiuPhongResponseDTO response(PhysicalRoomHold h,int quantity,String message){return new GiuPhongResponseDTO(h.getId(),h.getPhongCuTheId(),h.getBookingId(),quantity,h.getNgayNhanPhong(),h.getNgayTraPhong(),h.getTrangThai(),h.getHetHanLuc(),message);}
}
