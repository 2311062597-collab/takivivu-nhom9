package com.example.authservice.controller;

import com.example.authservice.dto.CaiDatHeThongDTO;
import com.example.authservice.service.CaiDatHeThongService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/admin/settings")
@RequiredArgsConstructor
public class AdminSystemSettingsController {
    private final CaiDatHeThongService service;

    @GetMapping
    public ResponseEntity<List<CaiDatHeThongDTO>> get(Principal principal) {
        return ResponseEntity.ok(service.layTatCa(principal.getName()));
    }

    @PutMapping
    public ResponseEntity<List<CaiDatHeThongDTO>> update(@RequestBody Map<String, String> values, Principal principal) {
        return ResponseEntity.ok(service.capNhat(principal.getName(), values));
    }
}
