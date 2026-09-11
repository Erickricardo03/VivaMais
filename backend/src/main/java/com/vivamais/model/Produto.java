package com.vivamais.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "produtos", indexes = {
    @Index(name = "idx_prod_ativo_nome", columnList = "ativo, nome"),
    @Index(name = "idx_prod_cod_barras", columnList = "codigoBarras"),
    @Index(name = "idx_prod_validade", columnList = "ativo, dataValidade"),
    @Index(name = "idx_prod_estoque", columnList = "ativo, estoqueAtual, estoqueMinimo"),
    @Index(name = "idx_prod_categoria", columnList = "ativo, categoria")
})
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 60)
    private String codigoBarras;

    @Column(nullable = false, length = 80)
    private String categoria;

    @Column(length = 500)
    private String descricao;

    @Column(nullable = false, length = 20)
    private String unidade = "UN"; // UN, KG, G, PCT, POTE

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precoCusto = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precoVenda = BigDecimal.ZERO;

    @Column(nullable = false)
    private Double estoqueAtual = 0.0;

    @Column(nullable = false)
    private Double estoqueMinimo = 5.0;

    private LocalDate dataValidade;

    @Column(length = 50)
    private String lote;

    @Column(nullable = false)
    private Boolean ativo = true;

    public Produto() {
    }

    public Produto(String nome, String codigoBarras, String categoria, String descricao,
                   String unidade, BigDecimal precoCusto, BigDecimal precoVenda,
                   Double estoqueAtual, Double estoqueMinimo, LocalDate dataValidade, String lote) {
        this.nome = nome;
        this.codigoBarras = codigoBarras;
        this.categoria = categoria;
        this.descricao = descricao;
        this.unidade = unidade;
        this.precoCusto = precoCusto;
        this.precoVenda = precoVenda;
        this.estoqueAtual = estoqueAtual;
        this.estoqueMinimo = estoqueMinimo;
        this.dataValidade = dataValidade;
        this.lote = lote;
        this.ativo = true;
    }

    @Transient
    public boolean isEstoqueBaixo() {
        return estoqueAtual != null && estoqueMinimo != null && estoqueAtual <= estoqueMinimo;
    }

    @Transient
    public boolean isVencido() {
        if (dataValidade == null) return false;
        return dataValidade.isBefore(LocalDate.now());
    }

    @Transient
    public boolean isVenceEmBreve() {
        if (dataValidade == null) return false;
        long dias = ChronoUnit.DAYS.between(LocalDate.now(), dataValidade);
        return dias >= 0 && dias <= 30;
    }

    @Transient
    public Long getDiasParaVencer() {
        if (dataValidade == null) return null;
        return ChronoUnit.DAYS.between(LocalDate.now(), dataValidade);
    }

    @Transient
    public String getStatusValidade() {
        if (dataValidade == null) return "SEM_VALIDADE";
        long dias = getDiasParaVencer();
        if (dias < 0) return "VENCIDO";
        if (dias <= 15) return "CRITICO";
        if (dias <= 45) return "ALERTA";
        return "REGULAR";
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public void setCodigoBarras(String codigoBarras) {
        this.codigoBarras = codigoBarras;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getUnidade() {
        return unidade;
    }

    public void setUnidade(String unidade) {
        this.unidade = unidade;
    }

    public BigDecimal getPrecoCusto() {
        return precoCusto;
    }

    public void setPrecoCusto(BigDecimal precoCusto) {
        this.precoCusto = precoCusto;
    }

    public BigDecimal getPrecoVenda() {
        return precoVenda;
    }

    public void setPrecoVenda(BigDecimal precoVenda) {
        this.precoVenda = precoVenda;
    }

    public Double getEstoqueAtual() {
        return estoqueAtual;
    }

    public void setEstoqueAtual(Double estoqueAtual) {
        this.estoqueAtual = estoqueAtual;
    }

    public Double getEstoqueMinimo() {
        return estoqueMinimo;
    }

    public void setEstoqueMinimo(Double estoqueMinimo) {
        this.estoqueMinimo = estoqueMinimo;
    }

    public LocalDate getDataValidade() {
        return dataValidade;
    }

    public void setDataValidade(LocalDate dataValidade) {
        this.dataValidade = dataValidade;
    }

    public String getLote() {
        return lote;
    }

    public void setLote(String lote) {
        this.lote = lote;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
}
