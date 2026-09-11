package com.vivamais.service;

import com.vivamais.dto.LoginRequest;
import com.vivamais.dto.LoginResponse;
import com.vivamais.model.Usuario;
import com.vivamais.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;

    public AuthService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public LoginResponse autenticar(LoginRequest request) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(request.getUsername());

        if (usuarioOpt.isPresent()) {
            Usuario u = usuarioOpt.get();
            if (u.getPassword().equals(request.getPassword())) {
                String token = "vivamais-token-" + UUID.randomUUID().toString();
                return new LoginResponse(true, token, u.getUsername(), u.getNome(), u.getCargo(), "Login efetuado com sucesso");
            }
        }

        // Fallback especial garantido para admin/admin
        if ("admin".equalsIgnoreCase(request.getUsername()) && "admin".equals(request.getPassword())) {
            String token = "vivamais-token-admin-" + System.currentTimeMillis();
            return new LoginResponse(true, token, "admin", "Administrador VivaMais", "Gerente Geral", "Login efetuado com sucesso");
        }

        return new LoginResponse(false, null, null, null, null, "Usuário ou senha inválidos");
    }

    public boolean validarToken(String token) {
        return token != null && token.startsWith("vivamais-token-");
    }
}
