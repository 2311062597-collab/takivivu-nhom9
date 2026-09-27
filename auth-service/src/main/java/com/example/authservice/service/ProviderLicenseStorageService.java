package com.example.authservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProviderLicenseStorageService {

    private static final long MAX_FILE_SIZE = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final Path storageDir;

    public ProviderLicenseStorageService(
            @Value("${app.upload.provider-license-dir:uploads/provider-licenses}") String storageDir
    ) {
        try {
            this.storageDir = Paths.get(storageDir).toAbsolutePath().normalize();
            Files.createDirectories(this.storageDir);
        } catch (IOException ex) {
            throw new RuntimeException("Không thể khởi tạo thư mục lưu giấy phép kinh doanh", ex);
        }
    }

    public Map<String, String> save(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ảnh giấy phép kinh doanh");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("Ảnh giấy phép kinh doanh không được vượt quá 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new RuntimeException("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
        }

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String fileName = UUID.randomUUID() + extension;
        Path target = storageDir.resolve(fileName).normalize();
        if (!target.startsWith(storageDir)) {
            throw new RuntimeException("Tên tệp không hợp lệ");
        }

        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu ảnh giấy phép kinh doanh", ex);
        }

        return Map.of(
                "fileName", fileName,
                "url", "/api/auth/provider-licenses/" + fileName
        );
    }

    public Resource load(String fileName) {
        try {
            Path file = storageDir.resolve(fileName).normalize();
            if (!file.startsWith(storageDir)) {
                throw new RuntimeException("Tệp không hợp lệ");
            }
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("Không tìm thấy ảnh giấy phép kinh doanh");
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new RuntimeException("Không thể đọc ảnh giấy phép kinh doanh", ex);
        }
    }
}
