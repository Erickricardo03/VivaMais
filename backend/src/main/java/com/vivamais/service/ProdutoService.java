package com.vivamais.service;

import com.vivamais.dto.AjusteEstoqueDTO;
import com.vivamais.dto.AlertaProdutoDTO;
import com.vivamais.dto.LeituraBalancaDTO;
import com.vivamais.model.MovimentacaoEstoque;
import com.vivamais.model.Produto;
import com.vivamais.model.TipoMovimentacao;
import com.vivamais.repository.MovimentacaoEstoqueRepository;
import com.vivamais.repository.ProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final BalancaBarcodeParser balancaBarcodeParser;

    public ProdutoService(ProdutoRepository produtoRepository,
                          MovimentacaoEstoqueRepository movimentacaoRepository,
                          BalancaBarcodeParser balancaBarcodeParser) {
        this.produtoRepository = produtoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.balancaBarcodeParser = balancaBarcodeParser;
    }

    public List<Produto> listarTodos() {
        return produtoRepository.findByAtivoTrueOrderByNomeAsc();
    }

    public Produto buscarPorId(Long id) {
        return produtoRepository.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado com ID: " + id));
    }

    public List<Produto> buscarPorTermo(String termo) {
        if (termo == null || termo.trim().isEmpty()) {
            return listarTodos();
        }
        return produtoRepository.buscarPorTermo(termo.trim());
    }

    @Transactional
    public Produto salvar(Produto produto) {
        if (produto.getAtivo() == null) {
            produto.setAtivo(true);
        }
        boolean novo = produto.getId() == null;
        Produto salvo = produtoRepository.save(produto);

        if (novo && salvo.getEstoqueAtual() != null && salvo.getEstoqueAtual() > 0) {
            MovimentacaoEstoque mov = new MovimentacaoEstoque(
                    salvo,
                    TipoMovimentacao.ENTRADA,
                    salvo.getEstoqueAtual(),
                    0.0,
                    salvo.getEstoqueAtual(),
                    "Estoque inicial de cadastro"
            );
            movimentacaoRepository.save(mov);
        }

        return salvo;
    }

    @Transactional
    public Produto atualizar(Long id, Produto dados) {
        Produto existente = buscarPorId(id);
        existente.setNome(dados.getNome());
        existente.setCodigoBarras(dados.getCodigoBarras());
        existente.setCategoria(dados.getCategoria());
        existente.setDescricao(dados.getDescricao());
        existente.setUnidade(dados.getUnidade());
        existente.setPrecoCusto(dados.getPrecoCusto());
        existente.setPrecoVenda(dados.getPrecoVenda());
        existente.setEstoqueMinimo(dados.getEstoqueMinimo());
        existente.setDataValidade(dados.getDataValidade());
        existente.setLote(dados.getLote());
        return produtoRepository.save(existente);
    }

    @Transactional
    public void desativar(Long id) {
        Produto p = buscarPorId(id);
        p.setAtivo(false);
        produtoRepository.save(p);
    }

    @Transactional
    public Produto ajustarEstoque(Long id, AjusteEstoqueDTO dto) {
        Produto p = buscarPorId(id);
        Double anterior = p.getEstoqueAtual();
        Double novo;

        if (dto.getTipo() == TipoMovimentacao.ENTRADA) {
            novo = anterior + dto.getQuantidade();
        } else if (dto.getTipo() == TipoMovimentacao.SAIDA) {
            if (anterior < dto.getQuantidade()) {
                throw new RuntimeException("Quantidade a retirar (" + dto.getQuantidade() + ") é maior que o estoque atual (" + anterior + ")");
            }
            novo = anterior - dto.getQuantidade();
        } else { // AJUSTE
            novo = dto.getQuantidade();
        }

        p.setEstoqueAtual(novo);
        Produto atualizado = produtoRepository.save(p);

        MovimentacaoEstoque mov = new MovimentacaoEstoque(
                atualizado,
                dto.getTipo(),
                dto.getQuantidade(),
                anterior,
                novo,
                dto.getMotivo() != null && !dto.getMotivo().isEmpty() ? dto.getMotivo() : "Ajuste manual de estoque"
        );
        movimentacaoRepository.save(mov);

        return atualizado;
    }

    public List<AlertaProdutoDTO> listarAlertasEstoqueBaixo() {
        return produtoRepository.findProdutosComEstoqueBaixo().stream()
                .map(this::converterParaAlertaDTO)
                .collect(Collectors.toList());
    }

    public List<AlertaProdutoDTO> listarAlertasValidade(Integer diasLimite) {
        int dias = (diasLimite != null && diasLimite > 0) ? diasLimite : 45;
        LocalDate limite = LocalDate.now().plusDays(dias);
        return produtoRepository.findProdutosVencendoAte(limite).stream()
                .map(this::converterParaAlertaDTO)
                .collect(Collectors.toList());
    }

    public List<AlertaProdutoDTO> listarTodosAlertas() {
        List<AlertaProdutoDTO> alertas = new ArrayList<>();

        // Produtos com estoque baixo
        for (Produto p : produtoRepository.findProdutosComEstoqueBaixo()) {
            alertas.add(converterParaAlertaDTO(p));
        }

        // Produtos a vencer em 45 dias ou já vencidos
        LocalDate limite = LocalDate.now().plusDays(45);
        for (Produto p : produtoRepository.findProdutosVencendoAte(limite)) {
            boolean jaExiste = alertas.stream().anyMatch(a -> a.getId().equals(p.getId()));
            if (!jaExiste) {
                alertas.add(converterParaAlertaDTO(p));
            }
        }

        // Ordenar por urgência: ALTA primeiro, depois MEDIA, depois BAIXA
        alertas.sort((a, b) -> pesoUrgencia(b.getNivelUrgencia()) - pesoUrgencia(a.getNivelUrgencia()));
        return alertas;
    }

    private int pesoUrgencia(String nivel) {
        if ("ALTA".equalsIgnoreCase(nivel)) return 3;
        if ("MEDIA".equalsIgnoreCase(nivel)) return 2;
        return 1;
    }

    private AlertaProdutoDTO converterParaAlertaDTO(Produto p) {
        AlertaProdutoDTO dto = new AlertaProdutoDTO();
        dto.setId(p.getId());
        dto.setNome(p.getNome());
        dto.setCategoria(p.getCategoria());
        dto.setUnidade(p.getUnidade());
        dto.setEstoqueAtual(p.getEstoqueAtual());
        dto.setEstoqueMinimo(p.getEstoqueMinimo());
        dto.setPrecoVenda(p.getPrecoVenda());
        dto.setDataValidade(p.getDataValidade());
        dto.setLote(p.getLote());
        dto.setDiasParaVencer(p.getDiasParaVencer());
        dto.setStatusValidade(p.getStatusValidade());
        dto.setEstoqueBaixo(p.isEstoqueBaixo());

        // Definir Nível de Urgência
        if (p.isVencido() || (p.getEstoqueAtual() != null && p.getEstoqueAtual() <= 0)) {
            dto.setNivelUrgencia("ALTA");
        } else if ("CRITICO".equals(p.getStatusValidade()) || (p.getEstoqueAtual() != null && p.getEstoqueAtual() <= p.getEstoqueMinimo() * 0.5)) {
            dto.setNivelUrgencia("ALTA");
        } else if ("ALERTA".equals(p.getStatusValidade()) || p.isEstoqueBaixo()) {
            dto.setNivelUrgencia("MEDIA");
        } else {
            dto.setNivelUrgencia("BAIXA");
        }

        return dto;
    }

    public List<String> listarCategorias() {
        return produtoRepository.findCategoriasDistintas();
    }

    /**
     * Interpreta um código de barras de etiqueta de balança de precificação, localiza o produto
     * correspondente pelo código cadastrado (Produto#codigoBalanca) e calcula o peso pesado a
     * partir do valor total lido e do preço de venda por unidade (KG/G) já cadastrado.
     */
    public LeituraBalancaDTO lerCodigoBalanca(String codigoLido) {
        BalancaBarcodeParser.LeituraBalanca leitura = balancaBarcodeParser.ler(codigoLido);

        Produto produto = produtoRepository.findByCodigoBalancaAndAtivoTrue(leitura.codigoProduto())
                .orElseThrow(() -> new RuntimeException(
                        "Nenhum produto cadastrado com o código de balança '" + leitura.codigoProduto() +
                        "'. Cadastre esse código no produto correspondente em Estoque, ou lance a venda manualmente."));

        if (produto.getPrecoVenda() == null || produto.getPrecoVenda().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException(
                    "O produto '" + produto.getNome() + "' não tem preço de venda por " + produto.getUnidade() +
                    " cadastrado, então não é possível calcular o peso. Cadastre o preço em Estoque ou lance a venda manualmente.");
        }

        BigDecimal peso = leitura.valorTotal().divide(produto.getPrecoVenda(), 3, RoundingMode.HALF_UP);

        LeituraBalancaDTO dto = new LeituraBalancaDTO();
        dto.setProdutoId(produto.getId());
        dto.setNomeProduto(produto.getNome());
        dto.setUnidade(produto.getUnidade());
        dto.setCodigoProduto(leitura.codigoProduto());
        dto.setPrecoVenda(produto.getPrecoVenda());
        dto.setValorLido(leitura.valorTotal());
        dto.setPesoCalculado(peso);

        return dto;
    }
}
