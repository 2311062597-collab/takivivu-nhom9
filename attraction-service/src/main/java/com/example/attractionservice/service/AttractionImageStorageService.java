package com.example.attractionservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class AttractionImageStorageService {
    private static final long MAX_FILE_SIZE = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private final Path storageDir;

    public AttractionImageStorageService(@Value("${app.upload.attraction-image-dir:uploads/attraction-images}") String storageDir) {
        try { this.storageDir = Paths.get(storageDir).toAbsolutePath().normalize(); Files.createDirectories(this.storageDir); }
        catch (IOException e) { throw new RuntimeException("Không thể khởi tạo thư mục lưu ảnh địa điểm", e); }
    }
    public Map<String,String> save(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new RuntimeException("Vui lòng chọn ảnh địa điểm");
        if (file.getSize() > MAX_FILE_SIZE) throw new RuntimeException("Ảnh địa điểm không được vượt quá 5MB");
        String type=file.getContentType();
        if (type == null || !ALLOWED_TYPES.contains(type)) throw new RuntimeException("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
        String ext = type.equals("image/png") ? ".png" : type.equals("image/webp") ? ".webp" : ".jpg";
        String name=UUID.randomUUID()+ext; Path target=storageDir.resolve(name).normalize();
        if (!target.startsWith(storageDir)) throw new RuntimeException("Tên tệp không hợp lệ");
        try { Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING); }
        catch(IOException e){ throw new RuntimeException("Không thể lưu ảnh địa điểm",e); }
        return Map.of("fileName",name,"url","/api/attractions/images/"+name);
    }
    public Resource load(String name) {
        try { Path f=storageDir.resolve(name).normalize(); if(!f.startsWith(storageDir)) throw new RuntimeException("Tệp không hợp lệ"); Resource r=new UrlResource(f.toUri()); if(!r.exists()||!r.isReadable()) throw new RuntimeException("Không tìm thấy ảnh địa điểm"); return r; }
        catch(MalformedURLException e){ throw new RuntimeException("Không thể đọc ảnh địa điểm",e); }
    }
}
