package com.vivamais.controller;

import com.vivamais.dto.AbrirCaixaDTO;
import com.vivamais.dto.DespesaCaixaDTO;
import com.vivamais.dto.FecharCaixaDTO;
import com.vivamais.model.Caixa;
import com.vivamais.service.CaixaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/caixa")
public class CaixaController {

    private final CaixaService caixaService;

    public CaixaController(CaixaService caixaService) {
        this.caixaService = caixaService;
    }

    @GetMapping("/atual")
    public ResponseEntity<Caixa> buscarAtual() {
        return caixaService.buscarCaixaAberto()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/abrir")
    public ResponseEntity<Caixa> abrir(@Valid @RequestBody AbrirCaixaDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(caixaService.abrirCaixa(dto));
    }

    @PostMapping("/despesas")
    public ResponseEntity<Caixa> adicionarDespesa(@Valid @RequestBody DespesaCaixaDTO dto) {
        return ResponseEntity.ok(caixaService.adicionarDespesa(dto));
    }

    @DeleteMapping("/despesas/{id}")
    public ResponseEntity<Caixa> removerDespesa(@PathVariable Long id) {
        return ResponseEntity.ok(caixaService.removerDespesa(id));
    }

    @PostMapping("/fechar")
    public ResponseEntity<Caixa> fechar(@Valid @RequestBody FecharCaixaDTO dto) {
        return ResponseEntity.ok(caixaService.fecharCaixa(dto));
    }

    @GetMapping("/historico")
    public ResponseEntity<List<Caixa>> historico() {
        return ResponseEntity.ok(caixaService.listarHistorico());
    }
}
