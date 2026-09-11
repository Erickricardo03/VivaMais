package com.vivamais.controller;

import com.vivamais.model.Cliente;
import com.vivamais.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public ResponseEntity<List<Cliente>> listar(@RequestParam(value = "termo", required = false) String termo) {
        if (termo != null && !termo.trim().isEmpty()) {
            return ResponseEntity.ok(clienteService.buscarPorTermo(termo));
        }
        return ResponseEntity.ok(clienteService.listarTodos());
    }

    @GetMapping("/inativos")
    public ResponseEntity<List<Cliente>> listarInativos(@RequestParam(value = "dias", required = false, defaultValue = "30") Integer dias) {
        return ResponseEntity.ok(clienteService.listarInativos(dias));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Cliente> criar(@Valid @RequestBody Cliente cliente) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.salvar(cliente));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> atualizar(@PathVariable Long id, @Valid @RequestBody Cliente cliente) {
        return ResponseEntity.ok(clienteService.atualizar(id, cliente));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        clienteService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
