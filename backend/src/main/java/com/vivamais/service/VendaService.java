package com.vivamais.service;

import com.vivamais.dto.ItemVendaDTO;
import com.vivamais.dto.VendaRequestDTO;
import com.vivamais.dto.VendaResponseDTO;
import com.vivamais.model.*;
import com.vivamais.repository.MovimentacaoEstoqueRepository;
import com.vivamais.repository.ProdutoRepository;
import com.vivamais.repository.VendaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VendaService {

    private final VendaRepository vendaRepository;
    private final ProdutoRepository produtoRepository;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final CaixaService caixaService;
    private final ClienteService clienteService;

    public VendaService(VendaRepository vendaRepository,
                        ProdutoRepository produtoRepository,
                        MovimentacaoEstoqueRepository movimentacaoRepository,
                        CaixaService caixaService,
                        ClienteService clienteService) {
        this.vendaRepository = vendaRepository;
        this.produtoRepository = produtoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.caixaService = caixaService;
        this.clienteService = clienteService;
    }

    @Transactional
    public VendaResponseDTO finalizarVenda(VendaRequestDTO request) {
        if (request.getItens() == null || request.getItens().isEmpty()) {
            throw new IllegalArgumentException("A venda deve conter ao menos um item");
        }

        Caixa caixaAberto = caixaService.getCaixaAbertoOuFalhar();

        Venda venda = new Venda();

        if (request.getClienteId() != null) {
            venda.setCliente(clienteService.buscarPorId(request.getClienteId()));
        }
        String codigoGerado = "VM-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd-HHmmss")) + "-" + ((int)(Math.random() * 900) + 100);
        venda.setNumeroVenda(codigoGerado);
        venda.setDataHora(LocalDateTime.now());
        venda.setFormaPagamento(request.getFormaPagamento());

        BigDecimal subtotalGeral = BigDecimal.ZERO;

        for (ItemVendaDTO itemDto : request.getItens()) {
            Produto produto = produtoRepository.findByIdAndAtivoTrue(itemDto.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto ID " + itemDto.getProdutoId() + " não encontrado ou inativo"));

            // Verificar estoque
            if (produto.getEstoqueAtual() < itemDto.getQuantidade()) {
                throw new RuntimeException("Estoque insuficiente para o produto '" + produto.getNome() +
                        "'. Disponível: " + produto.getEstoqueAtual() + " " + produto.getUnidade());
            }

            // Baixa imediata de estoque
            Double estoqueAnterior = produto.getEstoqueAtual();
            Double estoqueNovo = estoqueAnterior - itemDto.getQuantidade();
            produto.setEstoqueAtual(estoqueNovo);
            produtoRepository.save(produto);

            // Registro de movimentação no estoque
            MovimentacaoEstoque mov = new MovimentacaoEstoque(
                    produto,
                    TipoMovimentacao.VENDA,
                    itemDto.getQuantidade(),
                    estoqueAnterior,
                    estoqueNovo,
                    "Venda PDV " + codigoGerado
            );
            movimentacaoRepository.save(mov);

            // Criar ItemVenda
            ItemVenda item = new ItemVenda();
            item.setProduto(produto);
            item.setNomeProduto(produto.getNome());
            item.setQuantidade(itemDto.getQuantidade());
            item.setPrecoUnitario(itemDto.getPrecoUnitario() != null ? itemDto.getPrecoUnitario() : produto.getPrecoVenda());
            BigDecimal itemSubtotal = item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade()));
            item.setSubtotal(itemSubtotal);

            venda.adicionarItem(item);
            subtotalGeral = subtotalGeral.add(itemSubtotal);
        }

        venda.setSubtotal(subtotalGeral);

        BigDecimal desconto = request.getDesconto() != null ? request.getDesconto() : BigDecimal.ZERO;
        venda.setDesconto(desconto);

        BigDecimal total = subtotalGeral.subtract(desconto);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }
        venda.setValorTotal(total);

        // Tratamento de valores e troco
        if (request.getFormaPagamento() == FormaPagamento.DINHEIRO) {
            BigDecimal valorRecebido = request.getValorRecebido() != null ? request.getValorRecebido() : total;
            if (valorRecebido.compareTo(total) < 0) {
                throw new IllegalArgumentException("Valor recebido em dinheiro (" + valorRecebido + ") é menor que o total da venda (" + total + ")");
            }
            venda.setValorRecebido(valorRecebido);
            venda.setTroco(valorRecebido.subtract(total));
        } else {
            venda.setValorRecebido(total);
            venda.setTroco(BigDecimal.ZERO);
        }

        venda.setStatus("CONCLUIDA");
        Venda salva = vendaRepository.save(venda);

        caixaService.registrarVenda(caixaAberto, salva);

        if (salva.getCliente() != null) {
            clienteService.registrarCompra(salva.getCliente().getId(), salva.getValorTotal(), salva.getDataHora());
        }

        return converterParaResponseDTO(salva);
    }

    public List<VendaResponseDTO> listarRecentes() {
        return vendaRepository.findTop20ByOrderByDataHoraDesc().stream()
                .map(this::converterParaResponseDTO)
                .collect(Collectors.toList());
    }

    /** Vendas concluídas de hoje, mais recentes primeiro, com cliente e itens
     *  carregados — usado pelo Dashboard para o detalhamento das vendas do dia. */
    public List<VendaResponseDTO> listarHoje() {
        LocalDate hoje = LocalDate.now();
        LocalDateTime inicioHoje = hoje.atStartOfDay();
        LocalDateTime fimHoje = hoje.atTime(LocalTime.MAX);

        return vendaRepository.findByDataHoraBetweenAndStatusOrderByDataHoraDesc(inicioHoje, fimHoje, "CONCLUIDA").stream()
                .map(this::converterParaResponseDTO)
                .collect(Collectors.toList());
    }

    public VendaResponseDTO buscarPorId(Long id) {
        Venda v = vendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venda não encontrada com ID: " + id));
        return converterParaResponseDTO(v);
    }

    @Transactional
    public VendaResponseDTO cancelarVenda(Long id) {
        Venda venda = vendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venda não encontrada com ID: " + id));

        if ("CANCELADA".equals(venda.getStatus())) {
            throw new RuntimeException("Esta venda já foi cancelada anteriormente.");
        }

        // Estornar itens para o estoque
        for (ItemVenda item : venda.getItens()) {
            Produto produto = item.getProduto();
            Double anterior = produto.getEstoqueAtual();
            Double novo = anterior + item.getQuantidade();
            produto.setEstoqueAtual(novo);
            produtoRepository.save(produto);

            MovimentacaoEstoque mov = new MovimentacaoEstoque(
                    produto,
                    TipoMovimentacao.ENTRADA,
                    item.getQuantidade(),
                    anterior,
                    novo,
                    "Estorno por cancelamento da venda " + venda.getNumeroVenda()
            );
            movimentacaoRepository.save(mov);
        }

        venda.setStatus("CANCELADA");
        Venda atualizada = vendaRepository.save(venda);
        return converterParaResponseDTO(atualizada);
    }

    public VendaResponseDTO converterParaResponseDTO(Venda v) {
        VendaResponseDTO dto = new VendaResponseDTO();
        dto.setId(v.getId());
        dto.setNumeroVenda(v.getNumeroVenda());
        dto.setDataHora(v.getDataHora());
        dto.setSubtotal(v.getSubtotal());
        dto.setDesconto(v.getDesconto());
        dto.setValorTotal(v.getValorTotal());
        dto.setFormaPagamento(v.getFormaPagamento());
        dto.setValorRecebido(v.getValorRecebido());
        dto.setTroco(v.getTroco());
        dto.setStatus(v.getStatus());

        List<ItemVendaDTO> itens = new ArrayList<>();
        if (v.getItens() != null) {
            for (ItemVenda iv : v.getItens()) {
                ItemVendaDTO itemDto = new ItemVendaDTO(
                        iv.getProduto().getId(),
                        iv.getNomeProduto(),
                        iv.getQuantidade(),
                        iv.getPrecoUnitario()
                );
                itens.add(itemDto);
            }
        }
        dto.setItens(itens);

        if (v.getCliente() != null) {
            dto.setClienteId(v.getCliente().getId());
            dto.setClienteNome(v.getCliente().getNome());
        }

        return dto;
    }
}
