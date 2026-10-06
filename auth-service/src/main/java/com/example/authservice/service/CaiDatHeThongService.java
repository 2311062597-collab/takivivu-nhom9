package com.example.authservice.service;

import com.example.authservice.dto.CaiDatHeThongDTO;
import com.example.authservice.entity.CaiDatHeThong;
import com.example.authservice.entity.User;
import com.example.authservice.entity.VaiTro;
import com.example.authservice.repository.CaiDatHeThongRepository;
import com.example.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CaiDatHeThongService {
    private final CaiDatHeThongRepository repository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CaiDatHeThongDTO> layTatCa(String emailAdmin) {
        timAdmin(emailAdmin);
        return repository.findAllByOrderByIdAsc().stream().map(this::dto).toList();
    }

    @Transactional
    public List<CaiDatHeThongDTO> capNhat(String emailAdmin, Map<String, String> values) {
        User admin = timAdmin(emailAdmin);
        values.forEach((key, value) -> {
            CaiDatHeThong setting = repository.findByKhoa(key)
                    .orElseThrow(() -> new RuntimeException("Không tồn tại cấu hình: " + key));
            setting.setGiaTri(value);
            setting.setNguoiCapNhat(admin);
            repository.save(setting);
        });
        return repository.findAllByOrderByIdAsc().stream().map(this::dto).toList();
    }

    private User timAdmin(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản quản trị"));
        if (user.getVaiTro() != VaiTro.ADMIN) throw new RuntimeException("Bạn không có quyền quản trị hệ thống");
        return user;
    }

    private CaiDatHeThongDTO dto(CaiDatHeThong s) {
        return new CaiDatHeThongDTO(s.getKhoa(), s.getGiaTri(), s.getKieuDuLieu(), s.getNhom(), s.getMoTa(), s.getNgayCapNhat());
    }
}
