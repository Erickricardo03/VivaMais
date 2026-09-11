package com.vivamais.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class FaturamentoPeriodoDTO {

    private String periodo; // DIARIO, SEMANAL, MENSAL, ANUAL, CUSTOM
    private String dataInicio;
    private String dataFim;
    private BigDecimal faturamentoTotal = BigDecimal.ZERO;
    private BigDecimal custoTotal = BigDecimal.ZERO;
    private BigDecimal lucroEstimado = BigDecimal.ZERO;
    private Double margemLucroPercentual = 0.0;
    private long quantidadeVendas = 0;
    private BigDecimal ticketMedio = BigDecimal.ZERO;
    private List<PontoGraficoDTO> pontosGrafico = new ArrayList<>();
    private List<RankingProdutoDTO> rankingProdutos = new ArrayList<>();
    private List<VendaResponseDTO> vendas = new ArrayList<>();

    public FaturamentoPeriodoDTO() {
    }

    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
    }

    public String getDataInicio() {
        return dataInicio;
    }

    public void setDataInicio(String dataInicio) {
        this.dataInicio = dataInicio;
    }

    public String getDataFim() {
        return dataFim;
    }

    public void setDataFim(String dataFim) {
        this.dataFim = dataFim;
    }

    public BigDecimal getFaturamentoTotal() {
        return faturamentoTotal;
    }

    public void setFaturamentoTotal(BigDecimal faturamentoTotal) {
        this.faturamentoTotal = faturamentoTotal;
    }

    public BigDecimal getCustoTotal() {
        return custoTotal;
    }

    public void setCustoTotal(BigDecimal custoTotal) {
        this.custoTotal = custoTotal;
    }

    public BigDecimal getLucroEstimado() {
        return lucroEstimado;
    }

    public void setLucroEstimado(BigDecimal lucroEstimado) {
        this.lucroEstimado = lucroEstimado;
    }

    public Double getMargemLucroPercentual() {
        return margemLucroPercentual;
    }

    public void setMargemLucroPercentual(Double margemLucroPercentual) {
        this.margemLucroPercentual = margemLucroPercentual;
    }

    public long getQuantidadeVendas() {
        return quantidadeVendas;
    }

    public void setQuantidadeVendas(long quantidadeVendas) {
        this.quantidadeVendas = quantidadeVendas;
    }

    public BigDecimal getTicketMedio() {
        return ticketMedio;
    }

    public void setTicketMedio(BigDecimal ticketMedio) {
        this.ticketMedio = ticketMedio;
    }

    public List<PontoGraficoDTO> getPontosGrafico() {
        return pontosGrafico;
    }

    public void setPontosGrafico(List<PontoGraficoDTO> pontosGrafico) {
        this.pontosGrafico = pontosGrafico;
    }

    public List<RankingProdutoDTO> getRankingProdutos() {
        return rankingProdutos;
    }

    public void setRankingProdutos(List<RankingProdutoDTO> rankingProdutos) {
        this.rankingProdutos = rankingProdutos;
    }

    public List<VendaResponseDTO> getVendas() {
        return vendas;
    }

    public void setVendas(List<VendaResponseDTO> vendas) {
        this.vendas = vendas;
    }
}
