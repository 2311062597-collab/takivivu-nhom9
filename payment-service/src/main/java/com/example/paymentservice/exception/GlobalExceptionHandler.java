package com.example.paymentservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>>
    xuLyRuntime(
            RuntimeException exception
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
}