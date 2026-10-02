package com.example.flightservice.service;

import com.example.flightservice.dto.*;
import com.example.flightservice.entity.*;
import com.example.flightservice.repository.FlightHoldRepository;
import com.example.flightservice.repository.FlightRepository;
import com.example.flightservice.repository.FlightFareRepository;
import com.example.flightservice.repository.FlightSeatRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.Objects;
import java.util.Arrays;
import java.math.BigDecimal;

@Service
public class FlightService {

    @Value("${service.inventory.internal-token}")
    private String inventoryInternalToken;

    private final FlightRepository flightRepository;

    private final FlightHoldRepository flightHoldRepository;
    private final FlightFareRepository flightFareRepository;
    private final FlightSeatRepository flightSeatRepository;

    public FlightService(
            FlightRepository flightRepository,
            FlightHoldRepository flightHoldRepository,
            FlightFareRepository flightFareRepository,
            FlightSeatRepository flightSeatRepository
    ) {
        this.flightRepository =
                flightRepository;

        this.flightHoldRepository =
                flightHoldRepository;
        this.flightFareRepository = flightFareRepository;
        this.flightSeatRepository = flightSeatRepository;
    }

    @Transactional
    public FlightResponseDTO taoChuyenBay(
            FlightRequestDTO request,
            Long nhaCungCapId
    ) {

        chuanHoaVaKiemTraDuLieu(request, true);
        if (request.getMaChuyenBay() == null || request.getMaChuyenBay().isBlank()) {
            request.setMaChuyenBay(taoMaChuyenBayKhongTrung());
        } else if (flightRepository.existsByMaChuyenBay(request.getMaChuyenBay())) {
            // Trường hợp cực hiếm mã preview trên form đã được dùng trước khi submit.
            request.setMaChuyenBay(taoMaChuyenBayKhongTrung());
        }

        Flight flight = new Flight();

        flight.setNhaCungCapId(
                nhaCungCapId
        );

        flight.setMaChuyenBay(
                request.getMaChuyenBay()
        );

        flight.setHangHangKhong(
                request.getHangHangKhong()
        );

        flight.setDiemDi(
                request.getDiemDi()
        );

        flight.setDiemDen(
                request.getDiemDen()
        );

        flight.setSanBayDi(
                request.getSanBayDi()
        );

        flight.setSanBayDen(
                request.getSanBayDen()
        );

        flight.setThoiGianKhoiHanh(
                request.getThoiGianKhoiHanh()
        );

        flight.setThoiGianDen(
                request.getThoiGianDen()
        );

        flight.setHangVe(request.getHangVe());

        flight.setGiaVe(
                request.getGiaVe()
        );

        flight.setTongSoGhe(
                request.getTongSoGhe()
        );

        flight.setSoGheConLai(
                request.getTongSoGhe()
        );

        flight.setTrangThai(
                TrangThaiChuyenBay.SCHEDULED
        );

        Flight saved = flightRepository.save(flight);
        taoHangVeVaGhe(saved, request);
        return taoFlightResponse(saved);
    }

    public FlightResponseDTO layChiTiet(
            Long id
    ) {

        return taoFlightResponse(
                timChuyenBay(id)
        );
    }

    public List<FlightResponseDTO> layDanhSachCongKhai() {
        LocalDateTime now = LocalDateTime.now();
        return flightRepository.findAll().stream()
                .filter(flight -> flight.getTrangThai() == TrangThaiChuyenBay.SCHEDULED)
                .filter(flight -> flight.getThoiGianKhoiHanh() != null && flight.getThoiGianKhoiHanh().isAfter(now))
                .filter(flight -> flight.getSoGheConLai() != null && flight.getSoGheConLai() > 0)
                .map(this::taoFlightResponse)
                .toList();
    }

    public List<FlightResponseDTO> layTheoNhaCungCap(
            Long nhaCungCapId
    ) {

        return flightRepository
                .findByNhaCungCapId(
                        nhaCungCapId
                )
                .stream()
                .map(this::taoFlightResponse)
                .toList();
    }

    public List<FlightResponseDTO> timKiem(
            String diemDi,
            String diemDen,
            LocalDate ngayKhoiHanh
    ) {

        LocalDateTime tuThoiGian =
                ngayKhoiHanh.atStartOfDay();

        LocalDateTime denThoiGian =
                ngayKhoiHanh.atTime(
                        LocalTime.MAX
                );

        return flightRepository
                .findByDiemDiContainingIgnoreCaseAndDiemDenContainingIgnoreCaseAndThoiGianKhoiHanhBetweenAndTrangThai(
                        diemDi,
                        diemDen,
                        tuThoiGian,
                        denThoiGian,
                        TrangThaiChuyenBay.SCHEDULED
                )
                .stream()
                .filter(flight ->
                        flight.getSoGheConLai() > 0
                )
                .map(this::taoFlightResponse)
                .toList();
    }

    @Transactional
    public FlightResponseDTO capNhatChuyenBay(
            Long id,
            FlightRequestDTO request,
            Long nguoiDungId,
            String role
    ) {

        Flight flight =
                timChuyenBay(id);

        kiemTraQuyenSoHuu(
                flight,
                nguoiDungId,
                role
        );

        chuanHoaVaKiemTraDuLieu(request, false);

        if (flightRepository.existsByMaChuyenBayIgnoreCaseAndThoiGianKhoiHanhAndIdNot(
                request.getMaChuyenBay(), request.getThoiGianKhoiHanh(), flight.getId())) {
            throw new RuntimeException("Mã chuyến bay đã tồn tại tại cùng thời điểm khai thác");
        }

        int soGheDaDat =
                flight.getTongSoGhe()
                        - flight.getSoGheConLai();

        if (request.getTongSoGhe()
                < soGheDaDat) {

            throw new RuntimeException(
                    "Tổng số ghế mới không được nhỏ hơn số ghế đã được giữ hoặc đặt"
            );
        }

        flight.setMaChuyenBay(
                request.getMaChuyenBay()
        );

        flight.setHangHangKhong(
                request.getHangHangKhong()
        );

        flight.setDiemDi(
                request.getDiemDi()
        );

        flight.setDiemDen(
                request.getDiemDen()
        );

        flight.setSanBayDi(
                request.getSanBayDi()
        );

        flight.setSanBayDen(
                request.getSanBayDen()
        );

        flight.setThoiGianKhoiHanh(
                request.getThoiGianKhoiHanh()
        );

        flight.setThoiGianDen(
                request.getThoiGianDen()
        );

        flight.setHangVe(request.getHangVe());

        flight.setGiaVe(
                request.getGiaVe()
        );

        flight.setTongSoGhe(
                request.getTongSoGhe()
        );

        flight.setSoGheConLai(
                request.getTongSoGhe()
                        - soGheDaDat
        );

        Flight saved = flightRepository.save(flight);

        // Đồng bộ lại hạng vé + sơ đồ ghế khi Provider sửa chuyến bay.
        // Không được tái sinh mã ghế nếu chuyến đã có ghế được giữ/đặt vì sẽ làm mất liên kết booking.
        if (soGheDaDat > 0) {
            var oldFares = flightFareRepository.findByFlightIdOrderById(id);
            boolean fareConfigChanged = oldFares.size() != request.getHangVes().size();
            if (!fareConfigChanged) {
                for (int i = 0; i < oldFares.size(); i++) {
                    var oldFare = oldFares.get(i);
                    var newFare = request.getHangVes().get(i);
                    if (!oldFare.getHangVe().equalsIgnoreCase(newFare.getHangVe().trim())
                            || oldFare.getSoGhe() != newFare.getSoGhe()
                            || oldFare.getGiaVe().compareTo(newFare.getGiaVe()) != 0) {
                        fareConfigChanged = true;
                        break;
                    }
                }
            }
            if (fareConfigChanged) {
                throw new RuntimeException("Không thể thay đổi cấu hình hạng vé/số ghế khi chuyến bay đã có ghế được giữ hoặc đặt");
            }
        } else {
            flightSeatRepository.deleteByFlightId(id);
            flightFareRepository.deleteByFlightId(id);
            flightSeatRepository.flush();
            flightFareRepository.flush();
            taoHangVeVaGhe(saved, request);
        }

        return taoFlightResponse(saved);
    }

    @Transactional
    public void xoaChuyenBay(
            Long id,
            Long nguoiDungId,
            String role
    ) {

        Flight flight =
                timChuyenBay(id);

        kiemTraQuyenSoHuu(
                flight,
                nguoiDungId,
                role
        );

        if (flight.getTrangThai() == TrangThaiChuyenBay.CANCELLED) {
            return;
        }
        flight.setTrangThai(TrangThaiChuyenBay.CANCELLED);
        flightRepository.save(flight);
    }

    @Transactional
    public FlightHoldResponseDTO giuGhe(
            Long chuyenBayId,
            FlightHoldRequestDTO request
    ) {
        Flight flight = flightRepository.findLockedById(chuyenBayId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chuyến bay"));

        if (flight.getTrangThai() != TrangThaiChuyenBay.SCHEDULED) {
            throw new RuntimeException("Chuyến bay hiện không mở bán");
        }
        if (flight.getThoiGianKhoiHanh().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Chuyến bay đã khởi hành");
        }
        if (flightHoldRepository.findByBookingIdAndChuyenBayId(request.getBookingId(), chuyenBayId).isPresent()) {
            throw new RuntimeException("Booking đã giữ ghế cho chuyến bay này");
        }

        List<String> requestedCodes = request.getSeatCodes() == null ? List.of() :
                request.getSeatCodes().stream().filter(Objects::nonNull).map(String::trim)
                        .filter(x -> !x.isBlank()).map(String::toUpperCase).distinct().toList();

        if (!requestedCodes.isEmpty() && requestedCodes.size() != request.getSoLuongGhe()) {
            throw new RuntimeException("Số mã ghế phải bằng số lượng ghế");
        }
        if (flight.getSoGheConLai() < request.getSoLuongGhe()) {
            throw new RuntimeException("Không đủ số ghế còn lại");
        }

        List<FlightSeat> selectedSeats;
        if (!requestedCodes.isEmpty()) {
            selectedSeats = flightSeatRepository.findByFlightIdAndMaGheIn(chuyenBayId, requestedCodes);
            if (selectedSeats.size() != requestedCodes.size()) {
                throw new RuntimeException("Có mã ghế không thuộc chuyến bay");
            }
            if (selectedSeats.stream().anyMatch(s -> !"AVAILABLE".equals(s.getTrangThai()))) {
                throw new RuntimeException("Có ghế vừa được người khác giữ hoặc đặt. Vui lòng chọn lại ghế.");
            }
        } else {
            selectedSeats = flightSeatRepository.findByFlightIdOrderById(chuyenBayId).stream()
                    .filter(s -> "AVAILABLE".equals(s.getTrangThai()))
                    .limit(request.getSoLuongGhe())
                    .toList();
            if (selectedSeats.size() != request.getSoLuongGhe()) {
                throw new RuntimeException("Không đủ ghế trống");
            }
        }

        Map<String, Long> countByFare = selectedSeats.stream()
                .collect(java.util.stream.Collectors.groupingBy(FlightSeat::getHangVe, java.util.stream.Collectors.counting()));
        for (Map.Entry<String, Long> entry : countByFare.entrySet()) {
            FlightFare fare = flightFareRepository.findByFlightIdAndHangVe(chuyenBayId, entry.getKey())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hạng vé " + entry.getKey()));
            if (fare.getSoGheConLai() < entry.getValue()) {
                throw new RuntimeException("Hạng vé " + entry.getKey() + " không đủ ghế");
            }
            fare.setSoGheConLai(fare.getSoGheConLai() - entry.getValue().intValue());
            flightFareRepository.save(fare);
        }

        selectedSeats.forEach(s -> s.setTrangThai("HOLDING"));
        flightSeatRepository.saveAll(selectedSeats);
        flight.setSoGheConLai(flight.getSoGheConLai() - request.getSoLuongGhe());
        flightRepository.save(flight);

        FlightHold hold = new FlightHold();
        hold.setChuyenBay(flight);
        hold.setBookingId(request.getBookingId());
        hold.setSoLuongGhe(request.getSoLuongGhe());
        hold.setSeatCodes(String.join(",", selectedSeats.stream().map(FlightSeat::getMaGhe).toList()));
        hold.setTrangThai(TrangThaiHold.HOLDING);
        hold.setHetHanLuc(LocalDateTime.now().plusMinutes(15));

        return taoHoldResponse(flightHoldRepository.save(hold), "Giữ ghế thành công");
    }

    @Transactional
    public FlightHoldResponseDTO xacNhanHold(
            Long bookingId
    ) {
        FlightHold hold = timHoldTheoBooking(bookingId);
        if (hold.getTrangThai() != TrangThaiHold.HOLDING) {
            throw new RuntimeException("Hold hiện không ở trạng thái HOLDING");
        }
        if (hold.getHetHanLuc().isBefore(LocalDateTime.now())) {
            giaiPhongHoldHetHan(hold);
            throw new RuntimeException("Hold đã hết hạn");
        }

        capNhatTrangThaiGheTheoHold(hold, "BOOKED");
        hold.setTrangThai(TrangThaiHold.CONFIRMED);
        return taoHoldResponse(flightHoldRepository.save(hold), "Xác nhận giữ ghế thành công");
    }

    @Transactional
    public FlightHoldResponseDTO giaiPhongHold(
            Long bookingId
    ) {
        FlightHold hold = timHoldTheoBooking(bookingId);
        if (hold.getTrangThai() == TrangThaiHold.RELEASED) {
            return taoHoldResponse(hold, "Hold đã được giải phóng");
        }
        if (hold.getTrangThai() == TrangThaiHold.CONFIRMED) {
            throw new RuntimeException("Không thể giải phóng hold đã xác nhận");
        }

        hoanTraTonGhe(hold);
        hold.setTrangThai(TrangThaiHold.RELEASED);
        return taoHoldResponse(flightHoldRepository.save(hold), "Giải phóng ghế thành công");
    }

    /** Idempotent internal endpoint for approved mock refunds on CONFIRMED seats. */
    @Transactional
    public FlightHoldResponseDTO giaiPhongGheKhiHoanTien(Long bookingId, String internalToken) {
        kiemTraInternalToken(internalToken);
        FlightHold hold = timHoldTheoBooking(bookingId);
        if (hold.getTrangThai() == TrangThaiHold.RELEASED)
            return taoHoldResponse(hold, "Ghế đã được giải phóng");
        if (hold.getTrangThai() != TrangThaiHold.CONFIRMED
                && hold.getTrangThai() != TrangThaiHold.HOLDING)
            throw new RuntimeException("Không có ghế cần giải phóng khi hoàn tiền");
        Flight flight = flightRepository.findLockedById(hold.getChuyenBay().getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chuyến bay"));
        List<String> codes = tachMaGhe(hold.getSeatCodes());
        List<FlightSeat> seats = flightSeatRepository.findByFlightIdAndMaGheIn(flight.getId(), codes);
        Map<String, Long> byFare = seats.stream()
                .filter(seat -> "BOOKED".equals(seat.getTrangThai()) || "HOLDING".equals(seat.getTrangThai()))
                .collect(java.util.stream.Collectors.groupingBy(FlightSeat::getHangVe,
                        java.util.stream.Collectors.counting()));
        int released = byFare.values().stream().mapToInt(Long::intValue).sum();
        seats.stream().filter(seat -> "BOOKED".equals(seat.getTrangThai())
                || "HOLDING".equals(seat.getTrangThai()))
                .forEach(seat -> seat.setTrangThai("AVAILABLE"));
        flightSeatRepository.saveAll(seats);
        for (Map.Entry<String, Long> entry : byFare.entrySet()) {
            flightFareRepository.findByFlightIdAndHangVe(flight.getId(), entry.getKey()).ifPresent(fare -> {
                fare.setSoGheConLai(Math.min(fare.getSoGhe(),
                        fare.getSoGheConLai() + entry.getValue().intValue()));
                flightFareRepository.save(fare);
            });
        }
        flight.setSoGheConLai(Math.min(flight.getTongSoGhe(), flight.getSoGheConLai() + released));
        flightRepository.save(flight);
        hold.setTrangThai(TrangThaiHold.RELEASED);
        return taoHoldResponse(flightHoldRepository.save(hold), "Giải phóng ghế hoàn tiền mô phỏng");
    }

    private void chuanHoaVaKiemTraDuLieu(FlightRequestDTO request, boolean taoMoi) {
        if (request.getMaChuyenBay() != null) request.setMaChuyenBay(request.getMaChuyenBay().trim().toUpperCase());
        request.setDiemDi(request.getDiemDi().trim());
        request.setDiemDen(request.getDiemDen().trim());
        request.setSanBayDi(request.getSanBayDi().trim());
        request.setSanBayDen(request.getSanBayDen().trim());

        if (request.getHangVes() != null && !request.getHangVes().isEmpty()) {
            int total = request.getHangVes().stream().mapToInt(FlightFareRequestDTO::getSoGhe).sum();
            if (total != request.getTongSoGhe()) throw new RuntimeException("Tổng số ghế các hạng vé phải bằng tổng số ghế của chuyến bay");
            long distinct = request.getHangVes().stream().map(x -> x.getHangVe().trim().toLowerCase()).distinct().count();
            if (distinct != request.getHangVes().size()) throw new RuntimeException("Hạng vé không được trùng nhau");
            FlightFareRequestDTO cheapest = request.getHangVes().stream().min((a,b)->a.getGiaVe().compareTo(b.getGiaVe())).orElseThrow();
            request.setHangVe(cheapest.getHangVe()); request.setGiaVe(cheapest.getGiaVe());
        }
        if (request.getSanBayDi().equalsIgnoreCase(request.getSanBayDen())) {
            throw new RuntimeException("Sân bay đi phải khác sân bay đến");
        }
        if (request.getDiemDi().equalsIgnoreCase(request.getDiemDen())) {
            throw new RuntimeException("Điểm đi phải khác điểm đến");
        }
        if (taoMoi && !request.getThoiGianKhoiHanh().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Giờ khởi hành phải ở tương lai khi tạo chuyến bay");
        }
        kiemTraThoiGian(request);
    }

    private String taoMaChuyenBayKhongTrung() {
        String code;
        do { code = "TKV" + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(); }
        while (flightRepository.existsByMaChuyenBay(code));
        return code;
    }

    private void taoHangVeVaGhe(Flight flight, FlightRequestDTO request) {
        List<FlightFareRequestDTO> fares = request.getHangVes();
        if (fares == null || fares.isEmpty()) {
            FlightFareRequestDTO legacy = new FlightFareRequestDTO(); legacy.setHangVe(request.getHangVe()); legacy.setGiaVe(request.getGiaVe()); legacy.setSoGhe(request.getTongSoGhe());
            fares = List.of(legacy);
        }
        int seatIndex = 0;
        String[] letters = {"A","B","C","D","E","F"};
        for (FlightFareRequestDTO f : fares) {
            FlightFare fare = new FlightFare(null, flight, f.getHangVe().trim(), f.getGiaVe(), f.getSoGhe(), f.getSoGhe());
            flightFareRepository.save(fare);
            List<FlightSeat> seats = new ArrayList<>();
            for (int i=0;i<f.getSoGhe();i++) {
                int idx = seatIndex++;
                String code = (idx / 6 + 1) + letters[idx % 6];
                seats.add(new FlightSeat(null, flight, code, f.getHangVe().trim(), "AVAILABLE"));
            }
            flightSeatRepository.saveAll(seats);
        }
    }

    private Flight timChuyenBay(
            Long id
    ) {

        return flightRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy chuyến bay"
                        )
                );
    }

    private FlightHold timHoldTheoBooking(
            Long bookingId
    ) {

        List<FlightHold> holds =
                flightHoldRepository
                        .findByBookingId(
                                bookingId
                        );

        if (holds.isEmpty()) {

            throw new RuntimeException(
                    "Không tìm thấy hold của booking"
            );
        }

        return holds.getFirst();
    }

    private void kiemTraThoiGian(
            FlightRequestDTO request
    ) {

        if (!request.getThoiGianDen()
                .isAfter(
                        request.getThoiGianKhoiHanh()
                )) {

            throw new RuntimeException(
                    "Thời gian đến phải sau thời gian khởi hành"
            );
        }
    }

    private void kiemTraQuyenSoHuu(
            Flight flight,
            Long nguoiDungId,
            String role
    ) {

        if ("ADMIN".equals(role)) {
            return;
        }

        if (!"PROVIDER".equals(role)) {

            throw new RuntimeException(
                    "Bạn không có quyền quản lý chuyến bay"
            );
        }

        if (!flight.getNhaCungCapId()
                .equals(nguoiDungId)) {

            throw new RuntimeException(
                    "Bạn không có quyền chỉnh sửa chuyến bay của nhà cung cấp khác"
            );
        }
    }

    private void giaiPhongHoldHetHan(
            FlightHold hold
    ) {
        hoanTraTonGhe(hold);
        hold.setTrangThai(TrangThaiHold.EXPIRED);
        flightHoldRepository.save(hold);
    }

    private void capNhatTrangThaiGheTheoHold(FlightHold hold, String status) {
        List<String> codes = tachMaGhe(hold.getSeatCodes());
        if (codes.isEmpty()) return;
        List<FlightSeat> seats = flightSeatRepository.findByFlightIdAndMaGheIn(hold.getChuyenBay().getId(), codes);
        seats.forEach(s -> s.setTrangThai(status));
        flightSeatRepository.saveAll(seats);
    }

    private void hoanTraTonGhe(FlightHold hold) {
        Flight flight = hold.getChuyenBay();
        List<String> codes = tachMaGhe(hold.getSeatCodes());
        if (!codes.isEmpty()) {
            List<FlightSeat> seats = flightSeatRepository.findByFlightIdAndMaGheIn(flight.getId(), codes);
            Map<String, Long> countByFare = seats.stream()
                    .collect(java.util.stream.Collectors.groupingBy(FlightSeat::getHangVe, java.util.stream.Collectors.counting()));
            seats.stream().filter(s -> "HOLDING".equals(s.getTrangThai())).forEach(s -> s.setTrangThai("AVAILABLE"));
            flightSeatRepository.saveAll(seats);
            for (Map.Entry<String, Long> entry : countByFare.entrySet()) {
                flightFareRepository.findByFlightIdAndHangVe(flight.getId(), entry.getKey()).ifPresent(fare -> {
                    fare.setSoGheConLai(Math.min(fare.getSoGhe(), fare.getSoGheConLai() + entry.getValue().intValue()));
                    flightFareRepository.save(fare);
                });
            }
        }
        flight.setSoGheConLai(Math.min(flight.getTongSoGhe(), flight.getSoGheConLai() + hold.getSoLuongGhe()));
        flightRepository.save(flight);
    }

    private List<String> tachMaGhe(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split(",")).map(String::trim).filter(x -> !x.isBlank()).toList();
    }

    private FlightResponseDTO taoFlightResponse(
            Flight flight
    ) {

        // Customer must see the cheapest fare that is actually still on sale.
        // A sold-out fare must not remain the advertised starting price.
        var availableFares = flightFareRepository.findByFlightIdOrderById(flight.getId()).stream()
                .filter(f -> f.getSoGheConLai() != null && f.getSoGheConLai() > 0)
                .toList();
        var startingFare = availableFares.stream()
                .min(java.util.Comparator.comparing(FlightFare::getGiaVe))
                .orElse(null);
        return new FlightResponseDTO(
                flight.getId(),
                flight.getNhaCungCapId(),
                flight.getMaChuyenBay(),
                flight.getHangHangKhong(),
                flight.getDiemDi(),
                flight.getDiemDen(),
                flight.getSanBayDi(),
                flight.getSanBayDen(),
                flight.getThoiGianKhoiHanh(),
                flight.getThoiGianDen(),
                startingFare != null ? startingFare.getHangVe() : flight.getHangVe(),
                startingFare != null ? startingFare.getGiaVe() : flight.getGiaVe(),
                flight.getTongSoGhe(),
                flight.getSoGheConLai(),
                flight.getTrangThai()
        );
    }

    private FlightHoldResponseDTO taoHoldResponse(
            FlightHold hold,
            String thongBao
    ) {

        return new FlightHoldResponseDTO(
                hold.getId(),
                hold.getChuyenBay().getId(),
                hold.getBookingId(),
                hold.getSoLuongGhe(),
                hold.getTrangThai(),
                hold.getHetHanLuc(),
                thongBao
        );
    }


    // =========================================================
    // INTERNAL BOOKING -> INVENTORY
    // =========================================================

    @Transactional
    public FlightHoldResponseDTO xacNhanHoldNoiBo(
            Long bookingId,
            String internalToken
    ) {

        kiemTraInternalToken(internalToken);

        return xacNhanHold(bookingId);
    }

    @Transactional
    public FlightHoldResponseDTO giaiPhongHoldNoiBo(
            Long bookingId,
            String internalToken
    ) {

        kiemTraInternalToken(internalToken);

        return giaiPhongHold(bookingId);
    }

    private void kiemTraInternalToken(
            String token
    ) {

        if (token == null
                || token.isBlank()
                || !inventoryInternalToken.equals(token)) {

            throw new SecurityException(
                    "Internal token không hợp lệ"
            );
        }
    }

    public FlightInventoryDTO laySoDoGhe(Long flightId, Long userId, String role) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chuyến bay"));
        if ("PROVIDER".equals(role) && !java.util.Objects.equals(flight.getNhaCungCapId(), userId)) {
            throw new RuntimeException("Bạn không có quyền xem sơ đồ ghế của chuyến bay này");
        }
        if (("PUBLIC".equals(role) || "CUSTOMER".equals(role)) && flight.getTrangThai() != TrangThaiChuyenBay.SCHEDULED) {
            throw new RuntimeException("Chuyến bay hiện không mở bán");
        }
        var fares = flightFareRepository.findByFlightIdOrderById(flightId).stream()
                .map(f -> new FlightInventoryDTO.Fare(f.getId(), f.getHangVe(), f.getGiaVe(), f.getSoGhe(), f.getSoGheConLai())).toList();
        var seats = flightSeatRepository.findByFlightIdOrderById(flightId).stream()
                .map(x -> new FlightInventoryDTO.Seat(x.getId(), x.getMaGhe(), x.getHangVe(), x.getTrangThai())).toList();
        return new FlightInventoryDTO(flightId, fares, seats);
    }
}
