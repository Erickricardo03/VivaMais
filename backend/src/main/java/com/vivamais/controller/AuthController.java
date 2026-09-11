package com.vivamais.controller;

import com.vivamais.dto.LoginRequest;
import com.vivamais.dto.LoginResponse;
import com.vivamais.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.autenticar(request);
        if (response.isAuthenticated()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(401).body(response);
    }

    @GetMapping("/verificar")
    public ResponseEntity<?> verificar(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        if (authService.validarToken(token)) {
            return ResponseEntity.ok().body("{\"status\":\"valido\"}");
        }
        return ResponseEntity.status(401).body("{\"status\":\"invalido\"}");
    }
}
