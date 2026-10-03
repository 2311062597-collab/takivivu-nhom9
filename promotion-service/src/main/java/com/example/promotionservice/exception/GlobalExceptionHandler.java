package com.example.promotionservice.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String,Object>> api(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(body(ex.getStatus().value(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,Object>> validation(MethodArgumentNotValidException ex) {
        Map<String,String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        Map<String,Object> body = body(400, "Dữ liệu không hợp lệ");
        body.put("loi", errors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String,Object>> integrity(DataIntegrityViolationException ex) {
        String raw = ex.getMostSpecificCause() == null ? ex.getMessage() : ex.getMostSpecificCause().getMessage();
        String message = raw == null ? "" : raw.toLowerCase(Locale.ROOT);

        if (message.contains("uq_promotion_code")
                || (message.contains("duplicate") && message.contains("promotion_code"))) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(body(409, "Mã ưu đãi đã tồn tại. Hệ thống sẽ tạo mã mới, vui lòng thử lại."));
        }
        if (message.contains("data too long") && message.contains("image_url")) {
            return ResponseEntity.badRequest()
                    .body(body(400, "Không thể lưu ảnh ưu đãi vì cột image_url trong CSDL đang quá ngắn. Hãy chạy migration đổi image_url sang LONGTEXT."));
        }
        if (message.contains("chk_promotion_dates")) {
            return ResponseEntity.badRequest().body(body(400, "Ngày kết thúc phải sau ngày bắt đầu."));
        }
        if (message.contains("chk_promotion_discount_value") || message.contains("chk_percentage_value")) {
            return ResponseEntity.badRequest().body(body(400, "Giá trị giảm không hợp lệ."));
        }
        if (message.contains("chk_promotion_min_order")) {
            return ResponseEntity.badRequest().body(body(400, "Giá trị đơn hàng tối thiểu không được âm."));
        }
        return ResponseEntity.badRequest().body(body(400, "Dữ liệu ưu đãi vi phạm ràng buộc CSDL."));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String,Object>> runtime(RuntimeException ex) {
        return ResponseEntity.badRequest().body(body(400, ex.getMessage()));
    }

    private Map<String,Object> body(int status, String message) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("trangThai", status);
        m.put("thongBao", message);
        return m;
    }
}
