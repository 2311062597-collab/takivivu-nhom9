package com.example.notificationservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(
            IllegalArgumentException.class
    )
    public ResponseEntity<Map<String, Object>>
    xuLyDuLieuKhongHopLe(
            IllegalArgumentException exception
    ) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "trangThai",
                400
        );

        response.put(
                "thongBao",
                exception.getMessage()
        );

        return ResponseEntity
                .badRequest()
                .body(response);
    }

    @ExceptionHandler(
            SecurityException.class
    )
    public ResponseEntity<Map<String, Object>>
    xuLyKhongCoQuyen(
            SecurityException exception
    ) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "trangThai",
                403
        );

        response.put(
                "thongBao",
                exception.getMessage()
        );

        return ResponseEntity
                .status(
                        HttpStatus.FORBIDDEN
                )
                .body(response);
    }

    @ExceptionHandler(
            MethodArgumentNotValidException.class
    )
    public ResponseEntity<Map<String, Object>>
    xuLyValidation(
            MethodArgumentNotValidException exception
    ) {

        Map<String, String> errors =
                new LinkedHashMap<>();

        exception
                .getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        errors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "trangThai",
                400
        );

        response.put(
                "thongBao",
                "Dữ liệu không hợp lệ"
        );

        response.put(
                "loi",
                errors
        );

        return ResponseEntity
                .badRequest()
                .body(response);
    }

    @ExceptionHandler(
            RuntimeException.class
    )
    public ResponseEntity<Map<String, Object>>
    xuLyRuntime(
            RuntimeException exception
    ) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "trangThai",
                503
        );

        response.put(
                "thongBao",
                exception.getMessage()
        );

        return ResponseEntity
                .status(
                        HttpStatus.SERVICE_UNAVAILABLE
                )
                .body(response);
    }

    @ExceptionHandler(
            Exception.class
    )
    public ResponseEntity<Map<String, Object>>
    xuLyException(
            Exception exception
    ) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "trangThai",
                500
        );

        response.put(
                "thongBao",
                "Notification Service gặp lỗi."
        );

        return ResponseEntity
                .status(
                        HttpStatus.INTERNAL_SERVER_ERROR
                )
                .body(response);
    }
}