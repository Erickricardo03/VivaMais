package com.vivamais.controller;

import com.vivamais.dto.VendaRequestDTO;
import com.vivamais.dto.VendaResponseDTO;
import com.vivamais.service.VendaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendas")
public class VendaController {

    private final VendaService vendaService;

    public VendaController(VendaService vendaService) {
        this.vendaService = vendaService;
    }

    @PostMapping("/finalizar")
    public ResponseEntity<VendaResponseDTO> finalizarVenda(@Valid @RequestBody VendaRequestDTO request) {
        VendaResponseDTO venda = vendaService.finalizarVenda(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(venda);
    }

    @GetMapping
    public ResponseEntity<List<VendaResponseDTO>> listarRecentes() {
        return ResponseEntity.ok(vendaService.listarRecentes());
    }

    @GetMapping("/hoje")
    public ResponseEntity<List<VendaResponseDTO>> listarHoje() {
        return ResponseEntity.ok(vendaService.listarHoje());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendaResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(vendaService.buscarPorId(id));
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<VendaResponseDTO> cancelarVenda(@PathVariable Long id) {
        return ResponseEntity.ok(vendaService.cancelarVenda(id));
    }
}
