package com.vivamais.service;

import com.vivamais.model.Cliente;
import com.vivamais.repository.ClienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<Cliente> listarTodos() {
        return clienteRepository.findAllByOrderByNomeAsc();
    }

    public Cliente buscarPorId(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado com ID: " + id));
    }

    public List<Cliente> buscarPorTermo(String termo) {
        if (termo == null || termo.trim().isEmpty()) {
            return listarTodos();
        }
        return clienteRepository.buscarPorTermo(termo.trim());
    }

    @Transactional
    public Cliente salvar(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    @Transactional
    public Cliente atualizar(Long id, Cliente dados) {
        Cliente existente = buscarPorId(id);
        existente.setNome(dados.getNome());
        existente.setTelefone(dados.getTelefone());
        existente.setEmail(dados.getEmail());
        existente.setObservacoes(dados.getObservacoes());
        return clienteRepository.save(existente);
    }

    @Transactional
    public void excluir(Long id) {
        if (!clienteRepository.existsById(id)) {
            throw new RuntimeException("Cliente não encontrado com ID: " + id);
        }
        clienteRepository.deleteById(id);
    }

    /**
     * Clientes sem compra registrada há pelo menos {@code diasLimite} dias, ordenados do
     * mais tempo sumido para o mais recente (clientes que nunca compraram aparecem primeiro).
     */
    public List<Cliente> listarInativos(int diasLimite) {
        LocalDateTime limite = LocalDateTime.now().minusDays(diasLimite);

        return listarTodos().stream()
                .filter(c -> c.getUltimaCompra() == null || !c.getUltimaCompra().isAfter(limite))
                .sorted(Comparator.comparing(Cliente::getUltimaCompra, Comparator.nullsFirst(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Transactional
    public void registrarCompra(Long clienteId, BigDecimal valor, LocalDateTime dataHora) {
        Cliente cliente = buscarPorId(clienteId);
        cliente.setUltimaCompra(dataHora != null ? dataHora : LocalDateTime.now());
        cliente.setTotalCompras(cliente.getTotalCompras() + 1);
        cliente.setValorTotalGasto(cliente.getValorTotalGasto().add(valor));
        clienteRepository.save(cliente);
    }
}
