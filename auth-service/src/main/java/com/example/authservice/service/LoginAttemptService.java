package com.example.authservice.service;

import com.example.authservice.entity.TrangThaiNguoiDung;
import com.example.authservice.entity.User;
import com.example.authservice.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class LoginAttemptService {

    private static final int SO_LAN_SAI_TOI_DA = 5;
    private static final int CUA_SO_PHUT = 3;
    private static final int KHOA_PHUT = 30;

    private final UserRepository userRepository;

    public LoginAttemptService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ghiNhanDangNhapSai(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime batDauCuaSo = user.getDangNhapSaiTuLuc();

        int soLanSai;

        if (batDauCuaSo == null || now.isAfter(batDauCuaSo.plusMinutes(CUA_SO_PHUT))) {
            soLanSai = 1;
            user.setDangNhapSaiTuLuc(now);
        } else {
            soLanSai = user.getSoLanDangNhapSai() == null
                    ? 1
                    : user.getSoLanDangNhapSai() + 1;
        }

        user.setSoLanDangNhapSai(soLanSai);

        if (soLanSai >= SO_LAN_SAI_TOI_DA) {
            user.setTrangThai(TrangThaiNguoiDung.LOCKED);
            user.setKhoaDenLuc(now.plusMinutes(KHOA_PHUT));
        }

        userRepository.saveAndFlush(user);
    }
}
