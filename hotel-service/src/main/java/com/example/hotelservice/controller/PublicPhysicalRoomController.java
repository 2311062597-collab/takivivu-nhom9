package com.example.hotelservice.controller;

import com.example.hotelservice.entity.LoaiPhong;
import com.example.hotelservice.entity.PhongCuThe;
import com.example.hotelservice.repository.LoaiPhongRepository;
import com.example.hotelservice.repository.KhachSanRepository;
import com.example.hotelservice.entity.TrangThaiKhachSan;
import com.example.hotelservice.repository.PhongCuTheRepository;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.*;
import com.example.hotelservice.service.PhysicalBookingService;
import java.util.*;
import java.util.stream.Collectors;

/** Public physical-room inventory; date-scoped status reflects active physical-room holds. */
@RestController
@RequestMapping("/api/hotels")
public class PublicPhysicalRoomController {
    private final PhongCuTheRepository rooms;
    private final LoaiPhongRepository types;
    private final KhachSanRepository hotels;
    private final PhysicalBookingService booking;
    public PublicPhysicalRoomController(PhongCuTheRepository rooms, LoaiPhongRepository types, KhachSanRepository hotels,PhysicalBookingService booking) {
        this.rooms=rooms; this.types=types; this.hotels=hotels;this.booking=booking;
    }
    public record PhysicalRoomView(Long id, Long khachSanId, Long loaiPhongId,
        String tenLoaiPhong, String soPhong, Integer tang, BigDecimal giaMoiDem,
        String hinhAnh, String moTa, String tienNghi, Integer soNguoiLon,
        Integer soTreEm, String trangThai, boolean coTheDatTheoNgay) {}

    @GetMapping("/{hotelId}/physical-inventory")
    public List<PhysicalRoomView> inventory(@PathVariable Long hotelId,@RequestParam(required=false) LocalDate checkIn,@RequestParam(required=false) LocalDate checkOut) {
        if((checkIn==null)!=(checkOut==null))throw new IllegalArgumentException("Cần cả ngày nhận và trả phòng");
        if(checkIn!=null && !checkOut.isAfter(checkIn))throw new IllegalArgumentException("Ngày trả phòng không hợp lệ");
        if (hotels.findById(hotelId).filter(h->h.getTrangThai()==TrangThaiKhachSan.ACTIVE).isEmpty())
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,"Không tìm thấy khách sạn");
        Map<Long,LoaiPhong> byId=types.findByKhachSanIdOrderByIdDesc(hotelId).stream()
            .collect(Collectors.toMap(LoaiPhong::getId, t->t));
        return rooms.findByKhachSanIdOrderByTangAscSoPhongAsc(hotelId).stream()
            .filter(r->byId.containsKey(r.getLoaiPhongId()))
            .map(r->{
                LoaiPhong t=byId.get(r.getLoaiPhongId());
                // Without both dates, availability cannot be asserted.
                String status=(!Boolean.TRUE.equals(r.getDangHoatDong()) || !Boolean.TRUE.equals(t.getDangKinhDoanh()))
                    ? "INACTIVE" : checkIn==null ? "UNVERIFIED" : booking.occupied(r.getId(),checkIn,checkOut)?"BOOKED":"AVAILABLE";
                return new PhysicalRoomView(r.getId(),r.getKhachSanId(),r.getLoaiPhongId(),
                    t.getTenLoaiPhong(),r.getSoPhong(),r.getTang(),r.getGiaMoiDem(),
                    r.getHinhAnh()==null?t.getHinhAnh():r.getHinhAnh(),t.getMoTa(),t.getTienNghi(),
                    t.getSoNguoiLon(),t.getSoTreEm(),status,"AVAILABLE".equals(status));
            }).toList();
    }

    @GetMapping("/physical-inventory/max-price")
    public BigDecimal maxPrice() {
        Set<Long> active=hotels.findAll().stream().filter(h->h.getTrangThai()==TrangThaiKhachSan.ACTIVE).map(h->h.getId()).collect(Collectors.toSet());
        Set<Long> activeTypes=types.findAll().stream().filter(t->active.contains(t.getKhachSanId()) && Boolean.TRUE.equals(t.getDangKinhDoanh())).map(LoaiPhong::getId).collect(Collectors.toSet());
        return rooms.findAll().stream().filter(r->activeTypes.contains(r.getLoaiPhongId()) && Boolean.TRUE.equals(r.getDangHoatDong()))
            .map(PhongCuThe::getGiaMoiDem).filter(Objects::nonNull)
            .max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
    }
}
