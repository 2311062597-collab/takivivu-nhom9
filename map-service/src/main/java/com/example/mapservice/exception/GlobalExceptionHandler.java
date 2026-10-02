package com.example.mapservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
                HttpStatus.BAD_REQUEST.value()
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
                HttpStatus.INTERNAL_SERVER_ERROR.value()
        );

        response.put(
                "thongBao",
                "Map Service gặp lỗi. Vui lòng thử lại sau."
        );

        return ResponseEntity
                .status(
                        HttpStatus.INTERNAL_SERVER_ERROR
                )
                .body(response);
    }
}