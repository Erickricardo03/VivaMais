package com.vivamais.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class AlertaProdutoDTO {

    private Long id;
    private String nome;
    private String categoria;
    private String unidade;
    private Double estoqueAtual;
    private Double estoqueMinimo;
    private BigDecimal precoVenda;
    private LocalDate dataValidade;
    private String lote;
    private Long diasParaVencer;
    private String statusValidade; // VENCIDO, CRITICO, ALERTA, REGULAR
    private boolean estoqueBaixo;
    private String nivelUrgencia; // ALTA, MEDIA, BAIXA

    public AlertaProdutoDTO() {
    }

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

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getUnidade() {
        return unidade;
    }

    public void setUnidade(String unidade) {
        this.unidade = unidade;
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

    public BigDecimal getPrecoVenda() {
        return precoVenda;
    }

    public void setPrecoVenda(BigDecimal precoVenda) {
        this.precoVenda = precoVenda;
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

    public Long getDiasParaVencer() {
        return diasParaVencer;
    }

    public void setDiasParaVencer(Long diasParaVencer) {
        this.diasParaVencer = diasParaVencer;
    }

    public String getStatusValidade() {
        return statusValidade;
    }

    public void setStatusValidade(String statusValidade) {
        this.statusValidade = statusValidade;
    }

    public boolean isEstoqueBaixo() {
        return estoqueBaixo;
    }

    public void setEstoqueBaixo(boolean estoqueBaixo) {
        this.estoqueBaixo = estoqueBaixo;
    }

    public String getNivelUrgencia() {
        return nivelUrgencia;
    }

    public void setNivelUrgencia(String nivelUrgencia) {
        this.nivelUrgencia = nivelUrgencia;
    }
}
