package com.example.authservice.service;

import com.example.authservice.dto.*;
import com.example.authservice.entity.*;
import com.example.authservice.repository.AuditLogRepository;
import com.example.authservice.repository.ProviderProfileRepository;
import com.example.authservice.repository.RefreshTokenRepository;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LoginAttemptService loginAttemptService;
    private final RestClient restClient;

    @Value("${auth.internal-token}")
    private String internalToken;

    @Value("${service.notification.url:http://localhost:8089}")
    private String notificationUrl;

    @Value("${notification.internal-token:TAKIVIVU_NOTIFICATION_INTERNAL_2026}")
    private String notificationInternalToken;

    public AuthService(
            UserRepository userRepository,
            ProviderProfileRepository providerProfileRepository,
            RefreshTokenRepository refreshTokenRepository,
            AuditLogRepository auditLogRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            LoginAttemptService loginAttemptService
    ) {
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.loginAttemptService = loginAttemptService;
        this.restClient = RestClient.create();
    }

    private void chuanHoaVaKiemTraDangKy(String hoTen, String email, String matKhau, String xacNhanMatKhau) {
        if (hoTen == null || hoTen.trim().length() < 2) {
            throw new RuntimeException("Họ tên phải có ít nhất 2 ký tự");
        }
        if (email == null || email.trim().length() > 254) {
            throw new RuntimeException("Email không hợp lệ hoặc vượt quá 254 ký tự");
        }
        if (!Objects.equals(matKhau, xacNhanMatKhau)) {
            throw new RuntimeException("Xác nhận mật khẩu không khớp");
        }
    }

    // =========================================================
    // INTERNAL
    // =========================================================

    public boolean nguoiDungTonTai(
            Long userId,
            String token
    ) {

        kiemTraInternalToken(token);

        if (userId == null || userId <= 0) {
            return false;
        }

        return userRepository.existsById(userId);
    }

    public InternalUserContactResponseDTO layThongTinLienHeNoiBo(
            Long userId,
            String token
    ) {

        kiemTraInternalToken(token);

        if (userId == null || userId <= 0) {

            return new InternalUserContactResponseDTO(
                    userId,
                    null,
                    null,
                    false
            );
        }

        return userRepository
                .findById(userId)
                .map(user ->
                        new InternalUserContactResponseDTO(
                                user.getId(),
                                user.getHoTen(),
                                user.getEmail(),
                                true
                        )
                )
                .orElseGet(() ->
                        new InternalUserContactResponseDTO(
                                userId,
                                null,
                                null,
                                false
                        )
                );
    }

    private void kiemTraInternalToken(
            String token
    ) {

        if (token == null
                || token.isBlank()
                || !internalToken.equals(token)) {

            throw new SecurityException(
                    "Internal token không hợp lệ"
            );
        }
    }

    // =========================================================
    // REGISTER
    // =========================================================

    @Transactional
    public DangKyResponseDTO dangKyKhachHang(
            DangKyKhachHangRequestDTO request
    ) {

        chuanHoaVaKiemTraDangKy(request.getHoTen(), request.getEmail(), request.getMatKhau(), request.getXacNhanMatKhau());
        request.setHoTen(request.getHoTen().trim());
        request.setEmail(request.getEmail().trim().toLowerCase());

        kiemTraEmailVaSoDienThoai(
                request.getEmail(),
                request.getSoDienThoai()
        );

        User user = new User();

        user.setHoTen(request.getHoTen());
        user.setEmail(request.getEmail());
        user.setSoDienThoai(request.getSoDienThoai());

        user.setMatKhauMaHoa(
                passwordEncoder.encode(
                        request.getMatKhau()
                )
        );

        user.setVaiTro(
                VaiTro.CUSTOMER
        );

        user.setTrangThai(
                TrangThaiNguoiDung.ACTIVE
        );

        user.setSoLanDangNhapSai(0);
        user.setDangNhapSaiTuLuc(null);

        User userDaLuu =
                userRepository.save(user);

        guiThongBaoSauKhiCommit(
                userDaLuu.getId(),
                "Đăng ký tài khoản thành công",
                "Chào mừng bạn đến với Takivivu. Tài khoản khách hàng đã được tạo thành công.",
                "REGISTER_SUCCESS",
                "REGISTER_SUCCESS-CUSTOMER-" + userDaLuu.getId()
        );

        return taoDangKyResponse(
                userDaLuu,
                "Đăng ký khách hàng thành công"
        );
    }

    @Transactional
    public DangKyResponseDTO dangKyNhaCungCap(
            DangKyNhaCungCapRequestDTO request
    ) {

        chuanHoaVaKiemTraDangKy(request.getHoTen(), request.getEmail(), request.getMatKhau(), request.getXacNhanMatKhau());
        request.setHoTen(request.getHoTen().trim());
        request.setEmail(request.getEmail().trim().toLowerCase());

        kiemTraEmailVaSoDienThoai(
                request.getEmail(),
                request.getSoDienThoai()
        );

        User user = new User();

        user.setHoTen(request.getHoTen());
        user.setEmail(request.getEmail());
        user.setSoDienThoai(
                request.getSoDienThoai()
        );

        user.setMatKhauMaHoa(
                passwordEncoder.encode(
                        request.getMatKhau()
                )
        );

        user.setVaiTro(
                VaiTro.PROVIDER
        );

        user.setTrangThai(
                TrangThaiNguoiDung.PENDING_APPROVAL
        );

        user.setSoLanDangNhapSai(0);
        user.setDangNhapSaiTuLuc(null);

        User userDaLuu =
                userRepository.save(user);

        ProviderProfile providerProfile =
                new ProviderProfile();

        providerProfile.setNguoiDung(
                userDaLuu
        );

        providerProfile.setTenDoanhNghiep(
                request.getTenDoanhNghiep()
        );

        providerProfile.setAnhGiayPhepKinhDoanh(
                request.getAnhGiayPhepKinhDoanh()
        );

        providerProfile.setLoaiNhaCungCap(
                request.getLoaiNhaCungCap()
        );

        providerProfile.setTrangThaiDuyet(
                TrangThaiDuyet.PENDING
        );

        providerProfileRepository.save(
                providerProfile
        );

        guiThongBaoSauKhiCommit(
                userDaLuu.getId(),
                "Đăng ký nhà cung cấp thành công",
                "Hồ sơ nhà cung cấp đã được tạo và đang chờ quản trị viên phê duyệt.",
                "REGISTER_SUCCESS",
                "REGISTER_SUCCESS-PROVIDER-" + userDaLuu.getId()
        );

        return taoDangKyResponse(
                userDaLuu,
                "Đăng ký nhà cung cấp thành công, vui lòng chờ quản trị viên phê duyệt"
        );
    }

    // =========================================================
    // LOGIN
    // =========================================================

    @Transactional
    public DangNhapResponseDTO dangNhap(
            DangNhapRequestDTO request
    ) {

        User user =
                userRepository
                        .findByEmailIgnoreCase(
                                request.getEmail().trim()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Email hoặc mật khẩu không chính xác"
                                )
                        );

        if (user.getTrangThai()
                == TrangThaiNguoiDung.LOCKED) {

            if (user.getKhoaDenLuc() != null
                    && LocalDateTime.now()
                    .isAfter(
                            user.getKhoaDenLuc()
                    )) {

                user.setTrangThai(
                        TrangThaiNguoiDung.ACTIVE
                );

                user.setSoLanDangNhapSai(0);
                user.setKhoaDenLuc(null);
                user.setDangNhapSaiTuLuc(null);

                userRepository.save(user);

            } else {

                throw new RuntimeException(
                        "Tài khoản đang bị khóa tạm thời"
                );
            }
        }

        if (user.getTrangThai()
                == TrangThaiNguoiDung.INACTIVE) {

            throw new RuntimeException(
                    "Tài khoản đã bị vô hiệu hóa"
            );
        }

        if (user.getTrangThai()
                == TrangThaiNguoiDung.PENDING_APPROVAL) {

            throw new RuntimeException(
                    "Tài khoản nhà cung cấp đang chờ phê duyệt"
            );
        }

        if (!passwordEncoder.matches(
                request.getMatKhau(),
                user.getMatKhauMaHoa()
        )) {

            loginAttemptService.ghiNhanDangNhapSai(
                    user.getId()
            );

            throw new RuntimeException(
                    "Email hoặc mật khẩu không chính xác"
            );
        }

        user.setSoLanDangNhapSai(0);
        user.setKhoaDenLuc(null);
        user.setDangNhapSaiTuLuc(null);

        userRepository.save(user);

        String accessToken =
                jwtUtil.taoAccessToken(user);

        String refreshToken =
                taoRefreshToken(user);

        return new DangNhapResponseDTO(
                user.getId(),
                user.getHoTen(),
                user.getEmail(),
                user.getVaiTro(),
                layLoaiNhaCungCap(user),
                user.getTrangThai(),
                accessToken,
                refreshToken
        );
    }

    // =========================================================
    // REFRESH TOKEN
    // =========================================================

    @Transactional
    public DangNhapResponseDTO refreshToken(
            RefreshTokenRequestDTO request
    ) {

        String tokenHash =
                hashToken(
                        request.getRefreshToken()
                );

        RefreshToken refreshToken =
                refreshTokenRepository
                        .findByTokenHash(
                                tokenHash
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Refresh token không hợp lệ"
                                )
                        );

        if (Boolean.TRUE.equals(
                refreshToken.getDaThuHoi()
        )) {

            throw new RuntimeException(
                    "Refresh token đã bị thu hồi"
            );
        }

        if (refreshToken
                .getHetHanLuc()
                .isBefore(
                        LocalDateTime.now()
                )) {

            throw new RuntimeException(
                    "Refresh token đã hết hạn"
            );
        }

        User user =
                refreshToken.getNguoiDung();

        if (user.getTrangThai()
                != TrangThaiNguoiDung.ACTIVE) {

            throw new RuntimeException(
                    "Tài khoản hiện không được phép sử dụng"
            );
        }

        String accessToken =
                jwtUtil.taoAccessToken(user);

        return new DangNhapResponseDTO(
                user.getId(),
                user.getHoTen(),
                user.getEmail(),
                user.getVaiTro(),
                layLoaiNhaCungCap(user),
                user.getTrangThai(),
                accessToken,
                request.getRefreshToken()
        );
    }

    // =========================================================
    // LOGOUT
    // =========================================================

    @Transactional
    public void dangXuat(
            LogoutRequestDTO request
    ) {

        String tokenHash =
                hashToken(
                        request.getRefreshToken()
                );

        RefreshToken refreshToken =
                refreshTokenRepository
                        .findByTokenHash(
                                tokenHash
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Refresh token không hợp lệ"
                                )
                        );

        refreshToken.setDaThuHoi(true);

        refreshToken.setNgayThuHoi(
                LocalDateTime.now()
        );

        refreshTokenRepository.save(
                refreshToken
        );
    }

    // =========================================================
    // PROFILE
    // =========================================================

    public ThongTinCaNhanResponseDTO layThongTinCaNhan(
            String email
    ) {

        User user =
                timUserTheoEmail(email);

        return taoThongTinCaNhanResponse(
                user
        );
    }

    @Transactional
    public ThongTinCaNhanResponseDTO capNhatThongTinCaNhan(
            String email,
            CapNhatThongTinRequestDTO request
    ) {

        User user =
                timUserTheoEmail(email);

        if (!user.getSoDienThoai()
                .equals(
                        request.getSoDienThoai()
                )
                && userRepository
                .existsBySoDienThoai(
                        request.getSoDienThoai()
                )) {

            throw new RuntimeException(
                    "Số điện thoại đã tồn tại"
            );
        }

        user.setHoTen(
                request.getHoTen()
        );

        user.setSoDienThoai(
                request.getSoDienThoai()
        );

        user.setAnhDaiDien(
                request.getAnhDaiDien()
        );

        user.setDiaChi(
                request.getDiaChi()
        );

        User userDaLuu =
                userRepository.save(user);

        return taoThongTinCaNhanResponse(
                userDaLuu
        );
    }

    // =========================================================
    // PROVIDER
    // =========================================================

    public List<NhaCungCapResponseDTO>
    layDanhSachNhaCungCapChoDuyet() {

        return providerProfileRepository
                .findByTrangThaiDuyet(
                        TrangThaiDuyet.PENDING
                )
                .stream()
                .map(providerProfile ->
                        taoNhaCungCapResponse(
                                providerProfile,
                                "Đang chờ phê duyệt"
                        )
                )
                .toList();
    }

    @Transactional
    public NhaCungCapResponseDTO duyetNhaCungCap(
            Long providerProfileId,
            String emailAdmin
    ) {

        ProviderProfile providerProfile =
                providerProfileRepository
                        .findById(
                                providerProfileId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy nhà cung cấp"
                                )
                        );

        if (providerProfile
                .getTrangThaiDuyet()
                != TrangThaiDuyet.PENDING) {

            throw new RuntimeException(
                    "Hồ sơ nhà cung cấp đã được xử lý"
            );
        }

        User admin =
                timUserTheoEmail(
                        emailAdmin
                );

        if (admin.getVaiTro()
                != VaiTro.ADMIN) {

            throw new RuntimeException(
                    "Bạn không có quyền phê duyệt nhà cung cấp"
            );
        }

        User provider =
                providerProfile.getNguoiDung();

        providerProfile.setTrangThaiDuyet(
                TrangThaiDuyet.APPROVED
        );

        providerProfile.setNguoiDuyet(
                admin
        );

        providerProfile.setNgayDuyet(
                LocalDateTime.now()
        );

        providerProfile.setLyDoTuChoi(
                null
        );

        provider.setTrangThai(
                TrangThaiNguoiDung.ACTIVE
        );

        userRepository.save(
                provider
        );

        providerProfileRepository.save(
                providerProfile
        );

        ghiAuditLog(
                admin,
                "APPROVE_PROVIDER",
                "PROVIDER_PROFILE",
                providerProfile.getId(),
                "Phê duyệt nhà cung cấp: "
                        + provider.getEmail()
        );

        return taoNhaCungCapResponse(
                providerProfile,
                "Phê duyệt nhà cung cấp thành công"
        );
    }

    @Transactional
    public NhaCungCapResponseDTO tuChoiNhaCungCap(
            Long providerProfileId,
            String emailAdmin,
            DuyetNhaCungCapRequestDTO request
    ) {

        if (request.getLyDoTuChoi() == null
                || request
                .getLyDoTuChoi()
                .isBlank()) {

            throw new RuntimeException(
                    "Vui lòng nhập lý do từ chối"
            );
        }

        ProviderProfile providerProfile =
                providerProfileRepository
                        .findById(
                                providerProfileId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy nhà cung cấp"
                                )
                        );

        if (providerProfile
                .getTrangThaiDuyet()
                != TrangThaiDuyet.PENDING) {

            throw new RuntimeException(
                    "Hồ sơ nhà cung cấp đã được xử lý"
            );
        }

        User admin =
                timUserTheoEmail(
                        emailAdmin
                );

        if (admin.getVaiTro()
                != VaiTro.ADMIN) {

            throw new RuntimeException(
                    "Bạn không có quyền từ chối nhà cung cấp"
            );
        }

        User provider =
                providerProfile.getNguoiDung();

        providerProfile.setTrangThaiDuyet(
                TrangThaiDuyet.REJECTED
        );

        providerProfile.setNguoiDuyet(
                admin
        );

        providerProfile.setNgayDuyet(
                LocalDateTime.now()
        );

        providerProfile.setLyDoTuChoi(
                request.getLyDoTuChoi()
        );

        provider.setTrangThai(
                TrangThaiNguoiDung.INACTIVE
        );

        userRepository.save(
                provider
        );

        providerProfileRepository.save(
                providerProfile
        );

        ghiAuditLog(
                admin,
                "REJECT_PROVIDER",
                "PROVIDER_PROFILE",
                providerProfile.getId(),
                "Từ chối nhà cung cấp: "
                        + provider.getEmail()
                        + ". Lý do: "
                        + request.getLyDoTuChoi()
        );

        return taoNhaCungCapResponse(
                providerProfile,
                "Đã từ chối hồ sơ nhà cung cấp"
        );
    }

    // =========================================================
    // ADMIN MANAGEMENT
    // =========================================================

    public AdminDashboardResponseDTO layThongKeAdmin(
            String emailAdmin
    ) {

        timAdminTheoEmail(emailAdmin);

        return new AdminDashboardResponseDTO(
                userRepository.count(),
                userRepository.countByVaiTro(VaiTro.CUSTOMER),
                providerProfileRepository.count(),
                providerProfileRepository.countByTrangThaiDuyet(TrangThaiDuyet.PENDING),
                providerProfileRepository.countByTrangThaiDuyet(TrangThaiDuyet.APPROVED),
                providerProfileRepository.countByTrangThaiDuyet(TrangThaiDuyet.REJECTED),
                userRepository.countByTrangThai(TrangThaiNguoiDung.ACTIVE),
                userRepository.countByTrangThai(TrangThaiNguoiDung.LOCKED)
        );
    }


    public List<AdminUserResponseDTO> layDanhSachNguoiDungAdmin(
            String emailAdmin,
            VaiTro vaiTro,
            TrangThaiNguoiDung trangThai
    ) {

        timAdminTheoEmail(emailAdmin);

        return userRepository
                .findAllByOrderByNgayTaoDesc()
                .stream()
                .filter(user -> vaiTro == null || user.getVaiTro() == vaiTro)
                .filter(user -> trangThai == null || user.getTrangThai() == trangThai)
                .map(this::taoAdminUserResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponseDTO capNhatTrangThaiNguoiDungAdmin(
            Long userId,
            String emailAdmin,
            CapNhatTrangThaiNguoiDungRequestDTO request
    ) {

        User admin = timAdminTheoEmail(emailAdmin);

        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (user.getVaiTro() == VaiTro.ADMIN) {
            throw new RuntimeException("Không thể thay đổi trạng thái tài khoản ADMIN tại màn hình này");
        }

        if (request.getTrangThai() == TrangThaiNguoiDung.PENDING_APPROVAL
                && user.getVaiTro() != VaiTro.PROVIDER) {
            throw new RuntimeException("PENDING_APPROVAL chỉ áp dụng cho tài khoản PROVIDER");
        }

        TrangThaiNguoiDung trangThaiCu = user.getTrangThai();
        user.setTrangThai(request.getTrangThai());
        User daLuu = userRepository.save(user);

        ghiAuditLog(
                admin,
                "UPDATE_USER_STATUS",
                "USER",
                user.getId(),
                "Cập nhật trạng thái tài khoản " + user.getEmail()
                        + " từ " + trangThaiCu
                        + " sang " + request.getTrangThai()
        );

        return taoAdminUserResponse(daLuu);
    }

    public List<NhaCungCapResponseDTO> layDanhSachNhaCungCapAdmin(
            String emailAdmin,
            TrangThaiDuyet trangThai
    ) {

        timAdminTheoEmail(emailAdmin);

        List<ProviderProfile> danhSach = trangThai == null
                ? providerProfileRepository.findAllByOrderByNgayTaoDesc()
                : providerProfileRepository.findByTrangThaiDuyetOrderByNgayTaoDesc(trangThai);

        return danhSach
                .stream()
                .map(providerProfile ->
                        taoNhaCungCapResponse(
                                providerProfile,
                                null
                        )
                )
                .toList();
    }

    public List<AdminUserResponseDTO> layDanhSachKhachHangAdmin(
            String emailAdmin,
            TrangThaiNguoiDung trangThai
    ) {

        timAdminTheoEmail(emailAdmin);

        return userRepository
                .findByVaiTroOrderByNgayTaoDesc(VaiTro.CUSTOMER)
                .stream()
                .filter(user -> trangThai == null || user.getTrangThai() == trangThai)
                .map(this::taoAdminUserResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponseDTO capNhatTrangThaiKhachHangAdmin(
            Long userId,
            String emailAdmin,
            CapNhatTrangThaiNguoiDungRequestDTO request
    ) {

        User admin = timAdminTheoEmail(emailAdmin);

        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (user.getVaiTro() != VaiTro.CUSTOMER) {
            throw new RuntimeException("Chỉ được thay đổi trạng thái tài khoản khách hàng tại chức năng này");
        }

        if (request.getTrangThai() == TrangThaiNguoiDung.PENDING_APPROVAL) {
            throw new RuntimeException("Trạng thái PENDING_APPROVAL chỉ áp dụng cho nhà cung cấp");
        }

        TrangThaiNguoiDung trangThaiCu = user.getTrangThai();
        user.setTrangThai(request.getTrangThai());
        User daLuu = userRepository.save(user);

        ghiAuditLog(
                admin,
                "UPDATE_CUSTOMER_STATUS",
                "USER",
                user.getId(),
                "Cập nhật trạng thái khách hàng " + user.getEmail()
                        + " từ " + trangThaiCu
                        + " sang " + request.getTrangThai()
        );

        return taoAdminUserResponse(daLuu);
    }

    private User timAdminTheoEmail(
            String emailAdmin
    ) {

        User admin = timUserTheoEmail(emailAdmin);

        if (admin.getVaiTro() != VaiTro.ADMIN) {
            throw new RuntimeException("Bạn không có quyền quản trị hệ thống");
        }

        return admin;
    }

    // =========================================================
    // VALIDATION
    // =========================================================

    private void kiemTraEmailVaSoDienThoai(
            String email,
            String soDienThoai
    ) {

        if (userRepository.existsByEmail(
                email
        )) {

            throw new RuntimeException(
                    "Email đã tồn tại"
            );
        }

        if (userRepository.existsBySoDienThoai(
                soDienThoai
        )) {

            throw new RuntimeException(
                    "Số điện thoại đã tồn tại"
            );
        }
    }

    // =========================================================
    // FIND
    // =========================================================

    private User timUserTheoEmail(
            String email
    ) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy người dùng"
                        )
                );
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    private DangKyResponseDTO taoDangKyResponse(
            User user,
            String thongBao
    ) {

        return new DangKyResponseDTO(
                user.getId(),
                user.getHoTen(),
                user.getEmail(),
                user.getSoDienThoai(),
                user.getVaiTro(),
                user.getTrangThai(),
                thongBao
        );
    }

    private ThongTinCaNhanResponseDTO taoThongTinCaNhanResponse(
            User user
    ) {

        return new ThongTinCaNhanResponseDTO(
                user.getId(),
                user.getHoTen(),
                user.getEmail(),
                user.getSoDienThoai(),
                user.getVaiTro(),
                user.getTrangThai(),
                user.getAnhDaiDien(),
                user.getDiaChi()
        );
    }

    private LoaiNhaCungCap layLoaiNhaCungCap(
            User user
    ) {

        if (user.getVaiTro() != VaiTro.PROVIDER) {
            return null;
        }

        return providerProfileRepository
                .findByNguoiDungId(user.getId())
                .map(ProviderProfile::getLoaiNhaCungCap)
                .orElse(null);
    }

    private NhaCungCapResponseDTO taoNhaCungCapResponse(
            ProviderProfile providerProfile,
            String thongBao
    ) {

        User user =
                providerProfile.getNguoiDung();

        return new NhaCungCapResponseDTO(
                providerProfile.getId(),
                user.getId(),
                user.getHoTen(),
                user.getEmail(),
                user.getSoDienThoai(),
                providerProfile.getTenDoanhNghiep(),
                providerProfile.getAnhGiayPhepKinhDoanh(),
                providerProfile.getLoaiNhaCungCap(),
                providerProfile.getTrangThaiDuyet(),
                user.getTrangThai(),
                providerProfile.getLyDoTuChoi(),
                thongBao
        );
    }

    private AdminUserResponseDTO taoAdminUserResponse(
            User user
    ) {

        AdminUserResponseDTO response = new AdminUserResponseDTO();
        response.setId(user.getId());
        response.setHoTen(user.getHoTen());
        response.setEmail(user.getEmail());
        response.setSoDienThoai(user.getSoDienThoai());
        response.setVaiTro(user.getVaiTro());
        response.setTrangThai(user.getTrangThai());
        response.setAnhDaiDien(user.getAnhDaiDien());
        response.setDiaChi(user.getDiaChi());
        response.setNgayTao(user.getNgayTao());
        response.setNgayCapNhat(user.getNgayCapNhat());

        if (user.getVaiTro() == VaiTro.PROVIDER) {
            providerProfileRepository.findByNguoiDungId(user.getId()).ifPresent(profile -> {
                response.setProviderProfileId(profile.getId());
                response.setTenDoanhNghiep(profile.getTenDoanhNghiep());
                response.setAnhGiayPhepKinhDoanh(profile.getAnhGiayPhepKinhDoanh());
                response.setLoaiNhaCungCap(profile.getLoaiNhaCungCap());
                response.setTrangThaiDuyet(profile.getTrangThaiDuyet());
                response.setLyDoTuChoi(profile.getLyDoTuChoi());
            });
        }

        return response;
    }

    // =========================================================
    // AUDIT
    // =========================================================

    private void ghiAuditLog(
            User nguoiThucHien,
            String hanhDong,
            String loaiDoiTuong,
            Long doiTuongId,
            String moTa
    ) {

        AuditLog auditLog =
                new AuditLog();

        auditLog.setNguoiThucHien(
                nguoiThucHien
        );

        auditLog.setHanhDong(
                hanhDong
        );

        auditLog.setLoaiDoiTuong(
                loaiDoiTuong
        );

        auditLog.setDoiTuongId(
                doiTuongId
        );

        auditLog.setMoTa(
                moTa
        );

        auditLogRepository.save(
                auditLog
        );
    }

    // =========================================================
    // REFRESH TOKEN HELPERS
    // =========================================================

    private String taoRefreshToken(
            User user
    ) {

        String token =
                UUID.randomUUID()
                        + "-"
                        + UUID.randomUUID();

        RefreshToken refreshToken =
                new RefreshToken();

        refreshToken.setNguoiDung(
                user
        );

        refreshToken.setTokenHash(
                hashToken(token)
        );

        refreshToken.setHetHanLuc(
                LocalDateTime.now()
                        .plusDays(7)
        );

        refreshToken.setDaThuHoi(
                false
        );

        refreshTokenRepository.save(
                refreshToken
        );

        return token;
    }

    private String hashToken(
            String token
    ) {

        try {

            MessageDigest digest =
                    MessageDigest.getInstance(
                            "SHA-256"
                    );

            byte[] hash =
                    digest.digest(
                            token.getBytes(
                                    StandardCharsets.UTF_8
                            )
                    );

            return HexFormat
                    .of()
                    .formatHex(hash);

        } catch (Exception e) {

            throw new RuntimeException(
                    "Không thể xử lý refresh token"
            );
        }
    }

    // =========================================================
    // NOTIFICATION INTEGRATION
    // Gửi sau COMMIT để Notification Service có thể xác minh
    // user vừa được tạo thông qua Auth Service.
    // =========================================================

    private void guiThongBaoSauKhiCommit(
            Long userId,
            String title,
            String message,
            String type,
            String eventId
    ) {

        Runnable action = () -> {
            try {
                Map<String, Object> body = new HashMap<>();
                body.put("userId", userId);
                body.put("title", title);
                body.put("message", message);
                body.put("type", type);
                body.put("eventId", eventId);

                restClient
                        .post()
                        .uri(notificationUrl + "/api/notifications/internal")
                        .header("X-Internal-Token", notificationInternalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .toBodilessEntity();

            } catch (Exception e) {
                System.err.println(
                        "[AUTH->NOTIFICATION] Không gửi được thông báo: "
                                + e.getMessage()
                );
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            action.run();
                        }
                    }
            );
        } else {
            action.run();
        }
    }

}