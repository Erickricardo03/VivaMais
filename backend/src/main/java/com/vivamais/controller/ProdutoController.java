package com.vivamais.controller;

import com.vivamais.dto.AjusteEstoqueDTO;
import com.vivamais.dto.AlertaProdutoDTO;
import com.vivamais.model.Produto;
import com.vivamais.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @GetMapping
    public ResponseEntity<List<Produto>> listar(@RequestParam(value = "termo", required = false) String termo) {
        if (termo != null && !termo.trim().isEmpty()) {
            return ResponseEntity.ok(produtoService.buscarPorTermo(termo));
        }
        return ResponseEntity.ok(produtoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Produto> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(produtoService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Produto> criar(@Valid @RequestBody Produto produto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produtoService.salvar(produto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produto> atualizar(@PathVariable Long id, @Valid @RequestBody Produto produto) {
        return ResponseEntity.ok(produtoService.atualizar(id, produto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desativar(@PathVariable Long id) {
        produtoService.desativar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/ajustar-estoque")
    public ResponseEntity<Produto> ajustarEstoque(@PathVariable Long id, @Valid @RequestBody AjusteEstoqueDTO dto) {
        return ResponseEntity.ok(produtoService.ajustarEstoque(id, dto));
    }

    @GetMapping("/alertas/todos")
    public ResponseEntity<List<AlertaProdutoDTO>> listarTodosAlertas() {
        return ResponseEntity.ok(produtoService.listarTodosAlertas());
    }

    @GetMapping("/alertas/estoque-baixo")
    public ResponseEntity<List<AlertaProdutoDTO>> listarAlertasEstoqueBaixo() {
        return ResponseEntity.ok(produtoService.listarAlertasEstoqueBaixo());
    }

    @GetMapping("/alertas/vencimento")
    public ResponseEntity<List<AlertaProdutoDTO>> listarAlertasValidade(@RequestParam(value = "dias", required = false, defaultValue = "45") Integer dias) {
        return ResponseEntity.ok(produtoService.listarAlertasValidade(dias));
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<String>> listarCategorias() {
        return ResponseEntity.ok(produtoService.listarCategorias());
    }
}
