package com.vivamais.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimentacoes_estoque")
public class MovimentacaoEstoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimentacao tipo;

    @Column(nullable = false)
    private Double quantidade;

    @Column(nullable = false)
    private Double estoqueAnterior;

    @Column(nullable = false)
    private Double estoqueNovo;

    @Column(length = 255)
    private String motivo;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    public MovimentacaoEstoque() {
        this.dataHora = LocalDateTime.now();
    }

    public MovimentacaoEstoque(Produto produto, TipoMovimentacao tipo, Double quantidade,
                               Double estoqueAnterior, Double estoqueNovo, String motivo) {
        this.produto = produto;
        this.tipo = tipo;
        this.quantidade = quantidade;
        this.estoqueAnterior = estoqueAnterior;
        this.estoqueNovo = estoqueNovo;
        this.motivo = motivo;
        this.dataHora = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Produto getProduto() {
        return produto;
    }

    public void setProduto(Produto produto) {
        this.produto = produto;
    }

    public TipoMovimentacao getTipo() {
        return tipo;
    }

    public void setTipo(TipoMovimentacao tipo) {
        this.tipo = tipo;
    }

    public Double getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Double quantidade) {
        this.quantidade = quantidade;
    }

    public Double getEstoqueAnterior() {
        return estoqueAnterior;
    }

    public void setEstoqueAnterior(Double estoqueAnterior) {
        this.estoqueAnterior = estoqueAnterior;
    }

    public Double getEstoqueNovo() {
        return estoqueNovo;
    }

    public void setEstoqueNovo(Double estoqueNovo) {
        this.estoqueNovo = estoqueNovo;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }
}
