package com.example.aiservice.exception;

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
    xuLyDuLieu(
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
            MethodArgumentNotValidException.class
    )
    public ResponseEntity<Map<String, Object>>
    xuLyValidation(
            MethodArgumentNotValidException exception
    ) {

        Map<String, String> loi =
                new LinkedHashMap<>();

        exception
                .getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        loi.put(
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
                loi
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
                HttpStatus.SERVICE_UNAVAILABLE.value()
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
                "AI Service gặp lỗi. Vui lòng thử lại sau."
        );

        return ResponseEntity
                .status(500)
                .body(response);
    }
}