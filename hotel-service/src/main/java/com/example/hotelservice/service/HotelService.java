package com.example.hotelservice.service;

import com.example.hotelservice.dto.*;
import com.example.hotelservice.entity.*;
import com.example.hotelservice.repository.KhachSanRepository;
import com.example.hotelservice.repository.LoaiPhongRepository;
import com.example.hotelservice.repository.PhongCuTheRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class HotelService {

    @Value("${service.inventory.internal-token}")
    private String inventoryInternalToken;

    private final KhachSanRepository khachSanRepository;
    private final LoaiPhongRepository loaiPhongRepository;
    private final PhongCuTheRepository phongCuTheRepository;
    private final PhysicalBookingService physicalBooking;

    public HotelService(
            KhachSanRepository khachSanRepository,
            LoaiPhongRepository loaiPhongRepository, PhongCuTheRepository phongCuTheRepository, PhysicalBookingService physicalBooking
    ) {
        this.khachSanRepository = khachSanRepository;
        this.loaiPhongRepository=loaiPhongRepository;this.phongCuTheRepository=phongCuTheRepository;this.physicalBooking=physicalBooking;
    }

    @Transactional
    public KhachSanResponseDTO taoKhachSan(
            KhachSanRequestDTO request,
            Long nhaCungCapId
    ) {

        if (!khachSanRepository.findByNhaCungCapId(nhaCungCapId).isEmpty()) {
            throw new IllegalArgumentException("Mỗi nhà cung cấp chỉ được có một khách sạn");
        }
        KhachSan khachSan = new KhachSan();

        khachSan.setNhaCungCapId(nhaCungCapId);
        khachSan.setTenKhachSan(chuanHoa(request.getTenKhachSan()));
        khachSan.setMoTa(chuanHoa(request.getMoTa()));
        khachSan.setDiaChi(chuanHoa(request.getDiaChi()));
        khachSan.setThanhPho(chuanHoa(request.getThanhPho()));
        khachSan.setSoDienThoai(chuanHoa(request.getSoDienThoai()));
        khachSan.setEmail(request.getEmail() == null ? null : request.getEmail().trim().toLowerCase());
        khachSan.setHinhAnh(request.getHinhAnh());
        khachSan.setViDo(request.getViDo());
        khachSan.setKinhDo(request.getKinhDo());
        khachSan.setSoSao(request.getSoSao());
        khachSan.setSoTang(request.getSoTang());
        khachSan.setQuanHuyen(chuanHoa(request.getQuanHuyen()));
        khachSan.setTienNghi(chuanHoa(request.getTienNghi()));
        khachSan.setAnhGioiThieu(request.getAnhGioiThieu());
        khachSan.setAnhThuVien(request.getAnhThuVien());
        khachSan.setTrangThai(TrangThaiKhachSan.ACTIVE);

        return taoKhachSanResponse(
                khachSanRepository.save(khachSan)
        );
    }

    public KhachSanResponseDTO layChiTietKhachSanTheoNgay(Long id,LocalDate start,LocalDate end,Integer guests){
      kiemTraNgay(start,end);
      return taoKhachSanResponseTheoNgay(timKhachSan(id),start,end,guests==null?1:guests,null,null);
    }

    public KhachSanResponseDTO layChiTietKhachSan(
            Long id
    ) {

        return taoKhachSanResponse(
                timKhachSan(id)
        );
    }

    /*
     * Integration:
     * Booking Service dùng endpoint
     * GET /api/hotels/rooms/{phongId}
     * để lấy giá và thông tin phòng từ Hotel Service.
     */
    public PhongResponseDTO layChiTietPhong(Long phongId, Long phongCuTheId) {
        PhongResponseDTO type = taoPhongResponseMoi(phongId, null, null);
        if (phongCuTheId == null) return type;
        PhongCuThe physical = phongCuTheRepository.findById(phongCuTheId)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng cụ thể"));
        if (!physical.getLoaiPhongId().equals(phongId)
                || !physical.getKhachSanId().equals(type.getKhachSanId())
                || !Boolean.TRUE.equals(physical.getDangHoatDong())
                || !Boolean.TRUE.equals(loaiPhongRepository.findById(phongId).orElseThrow().getDangKinhDoanh())) {
            throw new IllegalArgumentException("Phòng cụ thể không hợp lệ hoặc đã ngừng kinh doanh");
        }
        type.setGiaMoiDem(physical.getGiaMoiDem());
        return type;
    }

    public List<KhachSanResponseDTO> layDanhSachCongKhai() {
        return khachSanRepository.findAll().stream()
                .filter(khachSan -> khachSan.getTrangThai() == TrangThaiKhachSan.ACTIVE)
                .map(this::taoKhachSanResponse)
                .toList();
    }

    public List<KhachSanResponseDTO> layKhachSanCuaNhaCungCap(
            Long nhaCungCapId
    ) {

        return khachSanRepository
                .findByNhaCungCapId(nhaCungCapId)
                .stream()
                .map(this::taoKhachSanResponse)
                .toList();
    }

    public List<KhachSanResponseDTO> timKiemKhachSan(
            String thanhPho,
            LocalDate ngayNhanPhong,
            LocalDate ngayTraPhong,
            Integer soKhach,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {

        kiemTraNgay(
                ngayNhanPhong,
                ngayTraPhong
        );

        if (soKhach == null || soKhach <= 0) {
            throw new RuntimeException(
                    "Số khách phải lớn hơn 0"
            );
        }

        List<KhachSan> danhSach =
                khachSanRepository
                        .findByThanhPhoContainingIgnoreCaseAndTrangThai(
                                thanhPho,
                                TrangThaiKhachSan.ACTIVE
                        );

        return danhSach.stream()
                .map(khachSan ->
                        taoKhachSanResponseTheoNgay(
                                khachSan,
                                ngayNhanPhong,
                                ngayTraPhong,
                                soKhach,
                                minPrice,
                                maxPrice
                        )
                )
                .filter(response ->
                        response.getDanhSachPhong() != null
                                && !response.getDanhSachPhong().isEmpty()
                )
                .toList();
    }

    @Transactional
    public KhachSanResponseDTO capNhatKhachSan(
            Long id,
            KhachSanRequestDTO request,
            Long userId,
            String role
    ) {

        KhachSan khachSan =
                timKhachSan(id);

        kiemTraQuyenKhachSan(
                khachSan,
                userId,
                role
        );

        khachSan.setTenKhachSan(chuanHoa(request.getTenKhachSan()));
        khachSan.setMoTa(chuanHoa(request.getMoTa()));
        khachSan.setDiaChi(chuanHoa(request.getDiaChi()));
        khachSan.setThanhPho(chuanHoa(request.getThanhPho()));
        khachSan.setSoDienThoai(chuanHoa(request.getSoDienThoai()));
        khachSan.setEmail(request.getEmail() == null ? null : request.getEmail().trim().toLowerCase());
        khachSan.setHinhAnh(request.getHinhAnh());
        khachSan.setViDo(request.getViDo());
        khachSan.setKinhDo(request.getKinhDo());
        khachSan.setSoSao(request.getSoSao());
        khachSan.setSoTang(request.getSoTang());
        khachSan.setQuanHuyen(chuanHoa(request.getQuanHuyen()));
        khachSan.setTienNghi(chuanHoa(request.getTienNghi()));
        khachSan.setAnhGioiThieu(request.getAnhGioiThieu());
        khachSan.setAnhThuVien(request.getAnhThuVien());

        return taoKhachSanResponse(
                khachSanRepository.save(khachSan)
        );
    }

    @Transactional
    public void xoaKhachSan(
            Long id,
            Long userId,
            String role
    ) {

        KhachSan khachSan =
                timKhachSan(id);

        kiemTraQuyenKhachSan(
                khachSan,
                userId,
                role
        );

        if (!loaiPhongRepository.findByKhachSanIdOrderByIdDesc(id).isEmpty()) {

            throw new RuntimeException(
                    "Không thể xóa khách sạn đang có loại phòng"
            );
        }

        khachSanRepository.delete(khachSan);
    }

    @Deprecated
    public PhongResponseDTO themPhong(Long khachSanId, PhongRequestDTO request, Long userId, String role) {
        throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.GONE, "API phòng cũ đã ngừng sử dụng; hãy dùng API quản lý loại phòng/phòng cụ thể của Provider");
    }


    @Deprecated
    public PhongResponseDTO capNhatPhong(Long khachSanId, Long phongId, PhongRequestDTO request, Long userId, String role) {
        throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.GONE, "API phòng cũ đã ngừng sử dụng; hãy dùng API quản lý loại phòng/phòng cụ thể của Provider");
    }


    @Deprecated
    public void xoaPhong(Long khachSanId, Long phongId, Long userId, String role) {
        throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.GONE, "API phòng cũ đã ngừng sử dụng; hãy dùng API quản lý loại phòng/phòng cụ thể của Provider");
    }


    @Deprecated
    public GiuPhongResponseDTO giuPhong(Long phongId, GiuPhongRequestDTO request) {
        return physicalBooking.hold(phongId, request);
    }


    public GiuPhongResponseDTO xacNhanHold(Long bookingId) {
        return physicalBooking.confirm(bookingId);
    }


    public GiuPhongResponseDTO giaiPhongHold(Long bookingId) {
        return physicalBooking.release(bookingId);
    }




    private KhachSan timKhachSan(
            Long id
    ) {

        return khachSanRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy khách sạn"
                        )
                );
    }





    private void kiemTraNgay(
            LocalDate ngayNhanPhong,
            LocalDate ngayTraPhong
    ) {

        if (ngayNhanPhong == null
                || ngayTraPhong == null) {

            throw new RuntimeException(
                    "Ngày nhận phòng và trả phòng không được để trống"
            );
        }

        if (!ngayTraPhong
                .isAfter(ngayNhanPhong)) {

            throw new RuntimeException(
                    "Ngày trả phòng phải sau ngày nhận phòng"
            );
        }
    }

    private void kiemTraQuyenKhachSan(
            KhachSan khachSan,
            Long userId,
            String role
    ) {

        if ("ADMIN".equals(role)) {
            return;
        }

        if (!"PROVIDER".equals(role)) {

            throw new RuntimeException(
                    "Bạn không có quyền quản lý khách sạn"
            );
        }

        if (!khachSan
                .getNhaCungCapId()
                .equals(userId)) {

            throw new RuntimeException(
                    "Bạn không có quyền quản lý khách sạn của nhà cung cấp khác"
            );
        }
    }

    private KhachSanResponseDTO taoKhachSanResponse(
            KhachSan khachSan
    ) {

        List<PhongResponseDTO> danhSachPhong = loaiPhongRepository.findByKhachSanIdOrderByIdDesc(khachSan.getId()).stream().map(t->taoPhongResponseMoi(t.getId(),null,null)).toList();

        KhachSanResponseDTO dto = new KhachSanResponseDTO(
                khachSan.getId(),
                khachSan.getNhaCungCapId(),
                khachSan.getTenKhachSan(),
                khachSan.getMoTa(),
                khachSan.getDiaChi(),
                khachSan.getThanhPho(),
                khachSan.getSoDienThoai(),
                khachSan.getEmail(),
                khachSan.getHinhAnh(),
                khachSan.getViDo(),
                khachSan.getKinhDo(),
                khachSan.getSoSao(),
                khachSan.getSoTang(),
                khachSan.getTrangThai(),
                danhSachPhong,
                khachSan.getQuanHuyen(),
                khachSan.getTienNghi(),
                khachSan.getAnhGioiThieu()
        );
        dto.setAnhThuVien(khachSan.getAnhThuVien());
        return dto;
    }

    private KhachSanResponseDTO taoKhachSanResponseTheoNgay(
            KhachSan khachSan,
            LocalDate ngayNhanPhong,
            LocalDate ngayTraPhong,
            Integer soKhach,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {

        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new RuntimeException("minPrice không được lớn hơn maxPrice");
        }

        List<PhongResponseDTO> danhSachPhong = loaiPhongRepository.findByKhachSanIdOrderByIdDesc(khachSan.getId()).stream()
            .filter(t->Boolean.TRUE.equals(t.getDangKinhDoanh()) && t.getSoNguoiLon()+t.getSoTreEm()>=soKhach)
            .filter(t->minPrice==null || t.getGiaCoBan().compareTo(minPrice)>=0)
            .filter(t->maxPrice==null || t.getGiaCoBan().compareTo(maxPrice)<=0)
            .map(t->taoPhongResponseMoi(t.getId(),ngayNhanPhong,ngayTraPhong))
            .filter(r->r.getSoPhongConLai()>0).toList();

        KhachSanResponseDTO dto = new KhachSanResponseDTO(
                khachSan.getId(),
                khachSan.getNhaCungCapId(),
                khachSan.getTenKhachSan(),
                khachSan.getMoTa(),
                khachSan.getDiaChi(),
                khachSan.getThanhPho(),
                khachSan.getSoDienThoai(),
                khachSan.getEmail(),
                khachSan.getHinhAnh(),
                khachSan.getViDo(),
                khachSan.getKinhDo(),
                khachSan.getSoSao(),
                khachSan.getSoTang(),
                khachSan.getTrangThai(),
                danhSachPhong,
                khachSan.getQuanHuyen(),
                khachSan.getTienNghi(),
                khachSan.getAnhGioiThieu()
        );
        dto.setAnhThuVien(khachSan.getAnhThuVien());
        return dto;
    }

    private PhongResponseDTO taoPhongResponseMoi(Long id,LocalDate start,LocalDate end){
      LoaiPhong t=loaiPhongRepository.findById(id).orElseThrow(()->new IllegalArgumentException("Không tìm thấy loại phòng"));
      List<PhongCuThe> all=phongCuTheRepository.findByKhachSanIdOrderByTangAscSoPhongAsc(t.getKhachSanId()).stream().filter(r->r.getLoaiPhongId().equals(id)&&Boolean.TRUE.equals(r.getDangHoatDong())).toList();
      int free=(start==null||end==null)?all.size():physicalBooking.available(id,start,end).size();
      if(!Boolean.TRUE.equals(t.getDangKinhDoanh()))free=0;
      return new PhongResponseDTO(t.getId(),t.getKhachSanId(),t.getTenLoaiPhong(),t.getMoTa(),t.getGiaCoBan(),all.size(),free,t.getSoNguoiLon()+t.getSoTreEm(),free>0?TrangThaiPhong.AVAILABLE:TrangThaiPhong.UNAVAILABLE);
    }






    // =========================================================
    // INTERNAL BOOKING -> INVENTORY
    // =========================================================

    @Transactional
    public GiuPhongResponseDTO xacNhanHoldNoiBo(
            Long bookingId,
            String internalToken
    ) {

        kiemTraInternalToken(internalToken);

        return xacNhanHold(bookingId);
    }

    @Transactional
    public GiuPhongResponseDTO giaiPhongHoldNoiBo(
            Long bookingId,
            String internalToken
    ) {

        kiemTraInternalToken(internalToken);

        return giaiPhongHold(bookingId);
    }

    @Transactional
    public GiuPhongResponseDTO giaiPhongPhongCuTheKhiHoanTien(Long bookingId, String internalToken) {
        kiemTraInternalToken(internalToken);
        return physicalBooking.releaseForRefund(bookingId);
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

    private String chuanHoa(String value) {
        if (value == null) {
            return null;
        }
        return value.trim().replaceAll("\\s+", " ");
    }

}