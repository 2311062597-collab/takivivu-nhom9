package com.example.attractionservice.service;

import com.example.attractionservice.dto.*;
import com.example.attractionservice.entity.*;
import com.example.attractionservice.repository.DanhMucLoaiVeThamQuanRepository;
import com.example.attractionservice.repository.DiaDiemThamQuanRepository;
import com.example.attractionservice.repository.GiuVeThamQuanRepository;
import com.example.attractionservice.repository.LoaiVeThamQuanRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class AttractionService {

    @Value("${service.inventory.internal-token}")
    private String inventoryInternalToken;

    private static final Set<String> TIEN_ICH_HOP_LE = Set.of(
            "Bãi đỗ xe",
            "Nhà vệ sinh",
            "WiFi miễn phí",
            "Khu vực chụp ảnh",
            "Lối đi cho người khuyết tật",
            "Gần phương tiện công cộng"
    );

    private static final Set<String> LOAI_DIA_DIEM_HOP_LE = Set.of(
            "Danh lam thắng cảnh",
            "Khu du lịch",
            "Văn hóa - Lịch sử",
            "Kiến trúc",
            "Mua sắm",
            "Vui chơi - Giải trí"
    );

    private final DiaDiemThamQuanRepository diaDiemRepository;
    private final LoaiVeThamQuanRepository loaiVeRepository;
    private final GiuVeThamQuanRepository giuVeRepository;
    private final DanhMucLoaiVeThamQuanRepository danhMucLoaiVeRepository;

    public AttractionService(
            DiaDiemThamQuanRepository diaDiemRepository,
            LoaiVeThamQuanRepository loaiVeRepository,
            GiuVeThamQuanRepository giuVeRepository,
            DanhMucLoaiVeThamQuanRepository danhMucLoaiVeRepository
    ) {
        this.diaDiemRepository = diaDiemRepository;
        this.loaiVeRepository = loaiVeRepository;
        this.giuVeRepository = giuVeRepository;
        this.danhMucLoaiVeRepository = danhMucLoaiVeRepository;
    }

    // =========================================================
    // ĐỊA ĐIỂM
    // =========================================================

    @Transactional
    public DiaDiemResponseDTO taoDiaDiem(
            DiaDiemRequestDTO request,
            Long nhaCungCapId
    ) {

        kiemTraGio(
                request.getGioMoCua(),
                request.getGioDongCua()
        );
        kiemTraTienIch(request.getTienIch());
        kiemTraLoaiDiaDiem(request.getLoaiDiaDiem());

        DiaDiemThamQuan diaDiem =
                new DiaDiemThamQuan();

        diaDiem.setNhaCungCapId(nhaCungCapId);
        diaDiem.setTenDiaDiem(request.getTenDiaDiem());
        diaDiem.setMoTa(request.getMoTa());
        diaDiem.setDiaChi(request.getDiaChi());
        diaDiem.setQuanHuyen(request.getQuanHuyen());
        diaDiem.setThanhPho(request.getThanhPho());
        diaDiem.setLoaiDiaDiem(request.getLoaiDiaDiem());
        diaDiem.setTienIch(serializeTienIch(request.getTienIch()));
        diaDiem.setViDo(request.getViDo());
        diaDiem.setKinhDo(request.getKinhDo());
        diaDiem.setPlaceId(request.getPlaceId());
        diaDiem.setGioMoCua(request.getGioMoCua());
        diaDiem.setGioDongCua(request.getGioDongCua());
        diaDiem.setHinhAnh(request.getHinhAnh());
        diaDiem.setTrangThai(TrangThaiDiaDiem.ACTIVE);

        return taoDiaDiemResponse(
                diaDiemRepository.save(diaDiem)
        );
    }

    public DiaDiemResponseDTO layChiTietDiaDiem(
            Long id
    ) {

        return taoDiaDiemResponse(
                timDiaDiem(id)
        );
    }

    /*
     * Integration:
     * Booking Service gọi:
     * GET /api/attractions/tickets/{loaiVeId}
     *
     * để lấy giá vé, trạng thái và thông tin loại vé.
     */
    public LoaiVeResponseDTO layChiTietLoaiVe(
            Long loaiVeId
    ) {

        return taoLoaiVeResponse(
                timLoaiVe(loaiVeId)
        );
    }

    public List<LoaiVeDanhMucDTO> layDanhMucLoaiVe() {
        return danhMucLoaiVeRepository.findByActiveTrueOrderByThuTuAsc()
                .stream()
                .map(item -> new LoaiVeDanhMucDTO(
                        item.getMaLoaiVe(),
                        item.getTenLoaiVe(),
                        item.getDoiTuongApDung(),
                        item.getThuTu()
                ))
                .toList();
    }

    public List<DiaDiemResponseDTO> layDanhSachCongKhai() {
        return diaDiemRepository.findAll().stream()
                .filter(diaDiem -> diaDiem.getTrangThai() == TrangThaiDiaDiem.ACTIVE)
                .map(this::taoDiaDiemResponse)
                .toList();
    }

    public List<DiaDiemResponseDTO> layDiaDiemCuaNhaCungCap(
            Long nhaCungCapId
    ) {

        return diaDiemRepository
                .findByNhaCungCapId(nhaCungCapId)
                .stream()
                .map(this::taoDiaDiemResponse)
                .toList();
    }

    public List<DiaDiemResponseDTO> timKiemDiaDiem(
            String thanhPho,
            LocalDate ngaySuDung,
            Integer soLuongVe
    ) {

        if (thanhPho == null || thanhPho.isBlank()) {
            throw new RuntimeException(
                    "Thành phố không được để trống"
            );
        }

        if (ngaySuDung == null) {
            throw new RuntimeException(
                    "Ngày sử dụng không được để trống"
            );
        }

        if (ngaySuDung.isBefore(LocalDate.now())) {
            throw new RuntimeException(
                    "Ngày sử dụng không được ở trong quá khứ"
            );
        }

        if (soLuongVe == null || soLuongVe <= 0) {
            throw new RuntimeException(
                    "Số lượng vé phải lớn hơn 0"
            );
        }

        return diaDiemRepository
                .findByThanhPhoContainingIgnoreCaseAndTrangThai(
                        thanhPho,
                        TrangThaiDiaDiem.ACTIVE
                )
                .stream()
                .map(diaDiem ->
                        taoDiaDiemResponseTheoNgay(
                                diaDiem,
                                ngaySuDung,
                                soLuongVe
                        )
                )
                .filter(response ->
                        response.getDanhSachLoaiVe() != null
                                && !response.getDanhSachLoaiVe().isEmpty()
                )
                .toList();
    }

    @Transactional
    public DiaDiemResponseDTO capNhatDiaDiem(
            Long id,
            DiaDiemRequestDTO request,
            Long userId,
            String role
    ) {

        DiaDiemThamQuan diaDiem =
                timDiaDiem(id);

        kiemTraQuyenDiaDiem(
                diaDiem,
                userId,
                role
        );

        kiemTraGio(
                request.getGioMoCua(),
                request.getGioDongCua()
        );
        kiemTraTienIch(request.getTienIch());
        kiemTraLoaiDiaDiem(request.getLoaiDiaDiem());

        diaDiem.setTenDiaDiem(request.getTenDiaDiem());
        diaDiem.setMoTa(request.getMoTa());
        diaDiem.setDiaChi(request.getDiaChi());
        diaDiem.setQuanHuyen(request.getQuanHuyen());
        diaDiem.setThanhPho(request.getThanhPho());
        diaDiem.setLoaiDiaDiem(request.getLoaiDiaDiem());
        diaDiem.setTienIch(serializeTienIch(request.getTienIch()));
        diaDiem.setViDo(request.getViDo());
        diaDiem.setKinhDo(request.getKinhDo());
        diaDiem.setPlaceId(request.getPlaceId());
        diaDiem.setGioMoCua(request.getGioMoCua());
        diaDiem.setGioDongCua(request.getGioDongCua());
        diaDiem.setHinhAnh(request.getHinhAnh());

        return taoDiaDiemResponse(
                diaDiemRepository.save(diaDiem)
        );
    }

    @Transactional
    public void xoaDiaDiem(
            Long id,
            Long userId,
            String role
    ) {

        DiaDiemThamQuan diaDiem =
                timDiaDiem(id);

        kiemTraQuyenDiaDiem(
                diaDiem,
                userId,
                role
        );

        if (loaiVeRepository.existsByDiaDiemId(id)) {
            throw new RuntimeException(
                    "Không thể xóa địa điểm đang có loại vé"
            );
        }

        diaDiemRepository.delete(diaDiem);
    }

    // =========================================================
    // LOẠI VÉ
    // =========================================================

    @Transactional
    public LoaiVeResponseDTO themLoaiVe(
            Long diaDiemId,
            LoaiVeRequestDTO request,
            Long userId,
            String role
    ) {

        DiaDiemThamQuan diaDiem =
                timDiaDiem(diaDiemId);

        kiemTraQuyenDiaDiem(
                diaDiem,
                userId,
                role
        );

        kiemTraNgayLoaiVe(
                request.getNgayBatDau(),
                request.getNgayKetThuc()
        );

        DanhMucLoaiVeThamQuan danhMuc = timDanhMucLoaiVe(request.getMaLoaiVe());
        if (loaiVeRepository.existsByDiaDiemIdAndMaLoaiVe(diaDiemId, danhMuc.getMaLoaiVe())) {
            throw new RuntimeException("Địa điểm đã có loại vé " + danhMuc.getTenLoaiVe());
        }

        LoaiVeThamQuan loaiVe =
                new LoaiVeThamQuan();

        loaiVe.setDiaDiem(diaDiem);
        loaiVe.setMaLoaiVe(danhMuc.getMaLoaiVe());
        loaiVe.setTenLoaiVe(danhMuc.getTenLoaiVe());
        loaiVe.setDoiTuongApDung(danhMuc.getDoiTuongApDung());
        loaiVe.setMoTa(request.getMoTa().trim());
        loaiVe.setGiaVe(request.getGiaVe());
        loaiVe.setTongSoVe(request.getTongSoVe());
        loaiVe.setSoVeConLai(request.getTongSoVe());
        loaiVe.setNgayBatDau(request.getNgayBatDau());
        loaiVe.setNgayKetThuc(request.getNgayKetThuc());
        loaiVe.setTrangThai(TrangThaiLoaiVe.AVAILABLE);

        return taoLoaiVeResponse(
                loaiVeRepository.save(loaiVe)
        );
    }

    @Transactional
    public LoaiVeResponseDTO capNhatLoaiVe(
            Long diaDiemId,
            Long loaiVeId,
            LoaiVeRequestDTO request,
            Long userId,
            String role
    ) {

        DiaDiemThamQuan diaDiem =
                timDiaDiem(diaDiemId);

        kiemTraQuyenDiaDiem(
                diaDiem,
                userId,
                role
        );

        LoaiVeThamQuan loaiVe =
                timLoaiVe(loaiVeId);

        if (!loaiVe.getDiaDiem()
                .getId()
                .equals(diaDiemId)) {

            throw new RuntimeException(
                    "Loại vé không thuộc địa điểm này"
            );
        }

        kiemTraNgayLoaiVe(
                request.getNgayBatDau(),
                request.getNgayKetThuc()
        );

        DanhMucLoaiVeThamQuan danhMuc = timDanhMucLoaiVe(request.getMaLoaiVe());
        if (loaiVeRepository.existsByDiaDiemIdAndMaLoaiVeAndIdNot(
                diaDiemId, danhMuc.getMaLoaiVe(), loaiVeId)) {
            throw new RuntimeException("Địa điểm đã có loại vé " + danhMuc.getTenLoaiVe());
        }

        loaiVe.setMaLoaiVe(danhMuc.getMaLoaiVe());
        loaiVe.setTenLoaiVe(danhMuc.getTenLoaiVe());
        loaiVe.setDoiTuongApDung(danhMuc.getDoiTuongApDung());
        loaiVe.setMoTa(request.getMoTa().trim());
        loaiVe.setGiaVe(request.getGiaVe());
        int soVeDaBan = Math.max(loaiVe.getTongSoVe() - loaiVe.getSoVeConLai(), 0);
        if (request.getTongSoVe() < soVeDaBan) {
            throw new RuntimeException("Tổng số vé không được nhỏ hơn số vé đã bán/đang giữ: " + soVeDaBan);
        }
        loaiVe.setTongSoVe(request.getTongSoVe());
        loaiVe.setSoVeConLai(request.getTongSoVe() - soVeDaBan);

        loaiVe.setNgayBatDau(request.getNgayBatDau());
        loaiVe.setNgayKetThuc(request.getNgayKetThuc());

        return taoLoaiVeResponse(
                loaiVeRepository.save(loaiVe)
        );
    }

    @Transactional
    public void xoaLoaiVe(
            Long diaDiemId,
            Long loaiVeId,
            Long userId,
            String role
    ) {

        DiaDiemThamQuan diaDiem =
                timDiaDiem(diaDiemId);

        kiemTraQuyenDiaDiem(
                diaDiem,
                userId,
                role
        );

        LoaiVeThamQuan loaiVe =
                timLoaiVe(loaiVeId);

        if (!loaiVe.getDiaDiem()
                .getId()
                .equals(diaDiemId)) {

            throw new RuntimeException(
                    "Loại vé không thuộc địa điểm này"
            );
        }

        if (giuVeRepository.existsByLoaiVeId(loaiVeId)) {
            throw new RuntimeException(
                    "Không thể xóa loại vé đã có dữ liệu đặt hoặc giữ vé"
            );
        }

        loaiVeRepository.delete(loaiVe);
    }

    // =========================================================
    // HOLD VÉ
    // =========================================================

    @Transactional
    public GiuVeResponseDTO giuVe(
            Long loaiVeId,
            GiuVeRequestDTO request
    ) {

        LoaiVeThamQuan loaiVe =
                loaiVeRepository.findLockedById(loaiVeId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy loại vé"));

        if (loaiVe.getTrangThai()
                != TrangThaiLoaiVe.AVAILABLE) {

            throw new RuntimeException(
                    "Loại vé hiện không khả dụng"
            );
        }

        kiemTraNgaySuDung(
                loaiVe,
                request.getNgaySuDung()
        );

        // Database has UNIQUE(booking_id, loai_ve_id, ngay_su_dung).
        // Reuse an expired/released row instead of inserting a duplicate.
        GiuVeThamQuan existing = giuVeRepository
                .findByBookingIdAndLoaiVeIdAndNgaySuDung(
                        request.getBookingId(), loaiVeId, request.getNgaySuDung())
                .orElse(null);
        if (existing != null && (existing.getTrangThai() == TrangThaiGiuVe.CONFIRMED
                || (existing.getTrangThai() == TrangThaiGiuVe.HOLDING
                    && existing.getHetHanLuc().isAfter(LocalDateTime.now())))) {
            throw new RuntimeException("Booking đã giữ loại vé này");
        }
        if (request.getSoLuongVe() == null || request.getSoLuongVe() <= 0) {
            throw new RuntimeException("Số lượng vé phải lớn hơn 0");
        }
        if (loaiVe.getDiaDiem().getTrangThai() != TrangThaiDiaDiem.ACTIVE) {
            throw new RuntimeException("Địa điểm hiện không hoạt động");
        }

        int soVeConLai =
                tinhSoVeConLai(
                        loaiVe,
                        request.getNgaySuDung()
                );

        if (soVeConLai < request.getSoLuongVe()) {
            throw new RuntimeException(
                    "Không đủ số vé còn lại trong ngày đã chọn"
            );
        }

        GiuVeThamQuan hold = existing != null ? existing : new GiuVeThamQuan();

        hold.setLoaiVe(loaiVe);
        hold.setBookingId(request.getBookingId());
        hold.setSoLuongVe(request.getSoLuongVe());
        hold.setNgaySuDung(request.getNgaySuDung());
        hold.setTrangThai(TrangThaiGiuVe.HOLDING);

        hold.setHetHanLuc(
                LocalDateTime.now()
                        .plusMinutes(15)
        );

        return taoGiuVeResponse(
                giuVeRepository.save(hold),
                "Giữ vé thành công"
        );
    }

    @Transactional
    public GiuVeResponseDTO xacNhanHold(Long bookingId) {
        List<GiuVeThamQuan> holds = giuVeRepository.findByBookingId(bookingId);
        if (holds.isEmpty()) throw new RuntimeException("Không tìm thấy hold của booking");
        LocalDateTime now = LocalDateTime.now();
        // Validate ALL items first: never partially confirm a multi-ticket booking.
        for (GiuVeThamQuan hold : holds) {
            if (hold.getTrangThai() != TrangThaiGiuVe.HOLDING
                    || !hold.getHetHanLuc().isAfter(now)) {
                throw new RuntimeException("Có vé không còn được giữ hợp lệ");
            }
        }
        holds.forEach(hold -> hold.setTrangThai(TrangThaiGiuVe.CONFIRMED));
        giuVeRepository.saveAll(holds);
        return taoGiuVeResponse(holds.get(0), "Xác nhận tất cả vé thành công");
    }

    @Transactional
    public GiuVeResponseDTO giaiPhongHold(Long bookingId) {
        List<GiuVeThamQuan> holds = giuVeRepository.findByBookingId(bookingId);
        if (holds.isEmpty()) throw new RuntimeException("Không tìm thấy hold của booking");
        if (holds.stream().anyMatch(h -> h.getTrangThai() == TrangThaiGiuVe.CONFIRMED)) {
            throw new RuntimeException("Vé đã xác nhận phải qua quy trình hủy/hoàn tiền");
        }
        for (GiuVeThamQuan hold : holds) {
            if (hold.getTrangThai() == TrangThaiGiuVe.HOLDING) {
                hold.setTrangThai(TrangThaiGiuVe.RELEASED);
            }
        }
        giuVeRepository.saveAll(holds);
        return taoGiuVeResponse(holds.get(0), "Đã giải phóng các vé còn giữ");
    }

    @Transactional
    public GiuVeResponseDTO giaiPhongKhiHoanTien(Long bookingId, String token) {
        if (inventoryInternalToken == null || inventoryInternalToken.isBlank()
                || !inventoryInternalToken.equals(token)) {
            throw new RuntimeException("Internal token không hợp lệ");
        }
        List<GiuVeThamQuan> holds = giuVeRepository.findByBookingId(bookingId);
        if (holds.isEmpty()) throw new RuntimeException("Không tìm thấy hold của booking");
        for (GiuVeThamQuan hold : holds) {
            if (hold.getTrangThai() == TrangThaiGiuVe.CONFIRMED
                    || hold.getTrangThai() == TrangThaiGiuVe.HOLDING) {
                hold.setTrangThai(TrangThaiGiuVe.RELEASED);
            }
        }
        giuVeRepository.saveAll(holds);
        return taoGiuVeResponse(holds.get(0), "Đã hoàn trả tồn vé cho booking");
    }

    // =========================================================
    // TÍNH AVAILABILITY
    // =========================================================

    private int tinhSoVeConLai(
            LoaiVeThamQuan loaiVe,
            LocalDate ngaySuDung
    ) {

        Long soVeDangDuocGiu =
                giuVeRepository.tongVeDangDuocGiu(
                        loaiVe.getId(),
                        ngaySuDung,
                        LocalDateTime.now(),
                        TrangThaiGiuVe.HOLDING,
                        TrangThaiGiuVe.CONFIRMED
                );

        int daDat =
                soVeDangDuocGiu == null
                        ? 0
                        : soVeDangDuocGiu.intValue();

        return Math.max(
                loaiVe.getTongSoVe() - daDat,
                0
        );
    }

    // =========================================================
    // FIND
    // =========================================================

    private DiaDiemThamQuan timDiaDiem(
            Long id
    ) {

        return diaDiemRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy địa điểm tham quan"
                        )
                );
    }

    private LoaiVeThamQuan timLoaiVe(
            Long id
    ) {

        return loaiVeRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy loại vé"
                        )
                );
    }

    private DanhMucLoaiVeThamQuan timDanhMucLoaiVe(String maLoaiVe) {
        String code = maLoaiVe == null ? "" : maLoaiVe.trim().toUpperCase();
        DanhMucLoaiVeThamQuan item = danhMucLoaiVeRepository.findById(code)
                .orElseThrow(() -> new RuntimeException("Loại vé không hợp lệ"));
        if (!Boolean.TRUE.equals(item.getActive())) {
            throw new RuntimeException("Loại vé hiện không được sử dụng");
        }
        return item;
    }

    private GiuVeThamQuan timHoldTheoBooking(
            Long bookingId
    ) {

        List<GiuVeThamQuan> danhSach =
                giuVeRepository
                        .findByBookingId(bookingId);

        if (danhSach.isEmpty()) {
            throw new RuntimeException(
                    "Không tìm thấy hold của booking"
            );
        }

        return danhSach.getFirst();
    }

    // =========================================================
    // VALIDATION
    // =========================================================

    private void kiemTraLoaiDiaDiem(String loaiDiaDiem) {
        if (loaiDiaDiem == null || !LOAI_DIA_DIEM_HOP_LE.contains(loaiDiaDiem.trim())) {
            throw new RuntimeException("Loại địa điểm không hợp lệ");
        }
    }

    private void kiemTraTienIch(List<String> tienIch) {
        if (tienIch == null) {
            return;
        }
        for (String item : tienIch) {
            if (item == null || !TIEN_ICH_HOP_LE.contains(item.trim())) {
                throw new RuntimeException("Tiện ích không hợp lệ: " + item);
            }
        }
    }

    private String serializeTienIch(List<String> tienIch) {
        if (tienIch == null || tienIch.isEmpty()) {
            return "";
        }
        return String.join(";", new LinkedHashSet<>(tienIch));
    }

    private List<String> deserializeTienIch(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(";"))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .distinct()
                .toList();
    }

    private void kiemTraGio(
            java.time.LocalTime gioMoCua,
            java.time.LocalTime gioDongCua
    ) {

        if (gioMoCua == null || gioDongCua == null) {
            throw new RuntimeException(
                    "Giờ mở cửa và đóng cửa không được để trống"
            );
        }

        if (!gioDongCua.isAfter(gioMoCua)) {
            throw new RuntimeException(
                    "Giờ đóng cửa phải sau giờ mở cửa"
            );
        }
    }

    private void kiemTraNgayLoaiVe(
            LocalDate ngayBatDau,
            LocalDate ngayKetThuc
    ) {

        if (ngayBatDau == null || ngayKetThuc == null) {
            throw new RuntimeException(
                    "Ngày bắt đầu và kết thúc không được để trống"
            );
        }

        if (ngayBatDau.isBefore(LocalDate.now())) {
            throw new RuntimeException(
                    "Ngày bắt đầu không được ở trong quá khứ"
            );
        }

        if (ngayKetThuc.isBefore(ngayBatDau)) {
            throw new RuntimeException(
                    "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu"
            );
        }
    }

    private void kiemTraNgaySuDung(
            LoaiVeThamQuan loaiVe,
            LocalDate ngaySuDung
    ) {

        if (ngaySuDung == null) {
            throw new RuntimeException(
                    "Ngày sử dụng không được để trống"
            );
        }

        if (ngaySuDung.isBefore(LocalDate.now())) {
            throw new RuntimeException(
                    "Ngày sử dụng không được ở trong quá khứ"
            );
        }

        if (ngaySuDung.isBefore(loaiVe.getNgayBatDau())
                || ngaySuDung.isAfter(loaiVe.getNgayKetThuc())) {

            throw new RuntimeException(
                    "Ngày sử dụng nằm ngoài thời gian áp dụng của loại vé"
            );
        }
    }

    private void kiemTraQuyenDiaDiem(
            DiaDiemThamQuan diaDiem,
            Long userId,
            String role
    ) {

        if ("ADMIN".equals(role)) {
            return;
        }

        if (!"PROVIDER".equals(role)) {
            throw new RuntimeException(
                    "Bạn không có quyền quản lý địa điểm tham quan"
            );
        }

        if (!diaDiem.getNhaCungCapId()
                .equals(userId)) {

            throw new RuntimeException(
                    "Bạn không có quyền quản lý địa điểm của nhà cung cấp khác"
            );
        }
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    private DiaDiemResponseDTO taoDiaDiemResponse(
            DiaDiemThamQuan diaDiem
    ) {

        List<LoaiVeResponseDTO> danhSachLoaiVe =
                loaiVeRepository
                        .findByDiaDiemId(
                                diaDiem.getId()
                        )
                        .stream()
                        .map(this::taoLoaiVeResponse)
                        .toList();

        return new DiaDiemResponseDTO(
                diaDiem.getId(),
                diaDiem.getNhaCungCapId(),
                diaDiem.getTenDiaDiem(),
                diaDiem.getMoTa(),
                diaDiem.getDiaChi(),
                diaDiem.getQuanHuyen(),
                diaDiem.getThanhPho(),
                diaDiem.getLoaiDiaDiem(),
                deserializeTienIch(diaDiem.getTienIch()),
                diaDiem.getViDo(),
                diaDiem.getKinhDo(),
                diaDiem.getPlaceId(),
                diaDiem.getGioMoCua(),
                diaDiem.getGioDongCua(),
                diaDiem.getHinhAnh(),
                diaDiem.getTrangThai(),
                danhSachLoaiVe
        );
    }

    private DiaDiemResponseDTO taoDiaDiemResponseTheoNgay(
            DiaDiemThamQuan diaDiem,
            LocalDate ngaySuDung,
            Integer soLuongVe
    ) {

        List<LoaiVeResponseDTO> danhSachLoaiVe =
                loaiVeRepository
                        .findByDiaDiemId(
                                diaDiem.getId()
                        )
                        .stream()

                        .filter(loaiVe ->
                                loaiVe.getTrangThai()
                                        == TrangThaiLoaiVe.AVAILABLE
                        )

                        .filter(loaiVe ->
                                !ngaySuDung.isBefore(
                                        loaiVe.getNgayBatDau()
                                )
                                        && !ngaySuDung.isAfter(
                                        loaiVe.getNgayKetThuc()
                                )
                        )

                        .map(loaiVe -> {

                            LoaiVeResponseDTO response =
                                    taoLoaiVeResponse(loaiVe);

                            response.setSoVeConLai(
                                    tinhSoVeConLai(
                                            loaiVe,
                                            ngaySuDung
                                    )
                            );

                            return response;
                        })

                        .filter(loaiVe ->
                                loaiVe.getSoVeConLai()
                                        >= soLuongVe
                        )

                        .toList();

        return new DiaDiemResponseDTO(
                diaDiem.getId(),
                diaDiem.getNhaCungCapId(),
                diaDiem.getTenDiaDiem(),
                diaDiem.getMoTa(),
                diaDiem.getDiaChi(),
                diaDiem.getQuanHuyen(),
                diaDiem.getThanhPho(),
                diaDiem.getLoaiDiaDiem(),
                deserializeTienIch(diaDiem.getTienIch()),
                diaDiem.getViDo(),
                diaDiem.getKinhDo(),
                diaDiem.getPlaceId(),
                diaDiem.getGioMoCua(),
                diaDiem.getGioDongCua(),
                diaDiem.getHinhAnh(),
                diaDiem.getTrangThai(),
                danhSachLoaiVe
        );
    }

    private LoaiVeResponseDTO taoLoaiVeResponse(
            LoaiVeThamQuan loaiVe
    ) {

        return new LoaiVeResponseDTO(
                loaiVe.getId(),
                loaiVe.getDiaDiem().getId(),
                loaiVe.getMaLoaiVe(),
                loaiVe.getTenLoaiVe(),
                loaiVe.getDoiTuongApDung(),
                loaiVe.getMoTa(),
                loaiVe.getGiaVe(),
                loaiVe.getTongSoVe(),
                loaiVe.getSoVeConLai(),
                loaiVe.getNgayBatDau(),
                loaiVe.getNgayKetThuc(),
                loaiVe.getTrangThai()
        );
    }

    private GiuVeResponseDTO taoGiuVeResponse(
            GiuVeThamQuan hold,
            String thongBao
    ) {

        return new GiuVeResponseDTO(
                hold.getId(),
                hold.getLoaiVe().getId(),
                hold.getBookingId(),
                hold.getSoLuongVe(),
                hold.getNgaySuDung(),
                hold.getTrangThai(),
                hold.getHetHanLuc(),
                thongBao
        );
    }


    // =========================================================
    // INTERNAL BOOKING -> INVENTORY
    // =========================================================

    @Transactional
    public GiuVeResponseDTO xacNhanHoldNoiBo(
            Long bookingId,
            String internalToken
    ) {

        kiemTraInternalToken(internalToken);

        return xacNhanHold(bookingId);
    }

    @Transactional
    public GiuVeResponseDTO giaiPhongHoldNoiBo(
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
}