package com.example.bookingservice.dto;

import com.example.bookingservice.entity.TrangThaiBooking;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDTO {
    private Long id;
    private String maBooking;
    private Long khachHangId;
    private BigDecimal tongTienGoc;
    private Long uuDaiId;
    private String maUuDai;
    private BigDecimal soTienGiam;
    private BigDecimal tongTien;
    private TrangThaiBooking trangThai;
    private LocalDateTime hetHanThanhToan;
    private List<BookingItemResponseDTO> danhSachDichVu;
    private String lyDoHuy;
    private String lyDoTuChoiHuy;
    private LocalDateTime hanXuLyHuy;

    // Preserve constructor used by existing Booking Service call sites.
    public BookingResponseDTO(Long id, String maBooking, Long khachHangId,
            BigDecimal tongTienGoc, Long uuDaiId, String maUuDai,
            BigDecimal soTienGiam, BigDecimal tongTien, TrangThaiBooking trangThai,
            LocalDateTime hetHanThanhToan, List<BookingItemResponseDTO> danhSachDichVu) {
        this.id=id; this.maBooking=maBooking; this.khachHangId=khachHangId;
        this.tongTienGoc=tongTienGoc; this.uuDaiId=uuDaiId;this.maUuDai=maUuDai;
        this.soTienGiam=soTienGiam;this.tongTien=tongTien;this.trangThai=trangThai;
        this.hetHanThanhToan=hetHanThanhToan;this.danhSachDichVu=danhSachDichVu;
    }
}
