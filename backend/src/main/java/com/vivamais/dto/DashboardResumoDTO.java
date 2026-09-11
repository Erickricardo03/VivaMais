package com.vivamais.dto;

import java.math.BigDecimal;

public class DashboardResumoDTO {

    // Métricas Financeiras
    private BigDecimal faturamentoHoje = BigDecimal.ZERO;
    private long vendasHoje = 0;

    private BigDecimal faturamentoSemana = BigDecimal.ZERO;
    private long vendasSemana = 0;

    private BigDecimal faturamentoMes = BigDecimal.ZERO;
    private long vendasMes = 0;

    private BigDecimal faturamentoAno = BigDecimal.ZERO;
    private long vendasAno = 0;

    private BigDecimal ticketMedioHoje = BigDecimal.ZERO;
    private BigDecimal ticketMedioMes = BigDecimal.ZERO;

    // Métricas de Estoque e Alertas
    private long totalProdutosCadastrados = 0;
    private long produtosEstoqueBaixoCount = 0;
    private long produtosVencendoCount = 0;
    private long produtosVencidosCount = 0;

    public DashboardResumoDTO() {
    }

    public BigDecimal getFaturamentoHoje() {
        return faturamentoHoje;
    }

    public void setFaturamentoHoje(BigDecimal faturamentoHoje) {
        this.faturamentoHoje = faturamentoHoje;
    }

    public long getVendasHoje() {
        return vendasHoje;
    }

    public void setVendasHoje(long vendasHoje) {
        this.vendasHoje = vendasHoje;
    }

    public BigDecimal getFaturamentoSemana() {
        return faturamentoSemana;
    }

    public void setFaturamentoSemana(BigDecimal faturamentoSemana) {
        this.faturamentoSemana = faturamentoSemana;
    }

    public long getVendasSemana() {
        return vendasSemana;
    }

    public void setVendasSemana(long vendasSemana) {
        this.vendasSemana = vendasSemana;
    }

    public BigDecimal getFaturamentoMes() {
        return faturamentoMes;
    }

    public void setFaturamentoMes(BigDecimal faturamentoMes) {
        this.faturamentoMes = faturamentoMes;
    }

    public long getVendasMes() {
        return vendasMes;
    }

    public void setVendasMes(long vendasMes) {
        this.vendasMes = vendasMes;
    }

    public BigDecimal getFaturamentoAno() {
        return faturamentoAno;
    }

    public void setFaturamentoAno(BigDecimal faturamentoAno) {
        this.faturamentoAno = faturamentoAno;
    }

    public long getVendasAno() {
        return vendasAno;
    }

    public void setVendasAno(long vendasAno) {
        this.vendasAno = vendasAno;
    }

    public BigDecimal getTicketMedioHoje() {
        return ticketMedioHoje;
    }

    public void setTicketMedioHoje(BigDecimal ticketMedioHoje) {
        this.ticketMedioHoje = ticketMedioHoje;
    }

    public BigDecimal getTicketMedioMes() {
        return ticketMedioMes;
    }

    public void setTicketMedioMes(BigDecimal ticketMedioMes) {
        this.ticketMedioMes = ticketMedioMes;
    }

    public long getTotalProdutosCadastrados() {
        return totalProdutosCadastrados;
    }

    public void setTotalProdutosCadastrados(long totalProdutosCadastrados) {
        this.totalProdutosCadastrados = totalProdutosCadastrados;
    }

    public long getProdutosEstoqueBaixoCount() {
        return produtosEstoqueBaixoCount;
    }

    public void setProdutosEstoqueBaixoCount(long produtosEstoqueBaixoCount) {
        this.produtosEstoqueBaixoCount = produtosEstoqueBaixoCount;
    }

    public long getProdutosVencendoCount() {
        return produtosVencendoCount;
    }

    public void setProdutosVencendoCount(long produtosVencendoCount) {
        this.produtosVencendoCount = produtosVencendoCount;
    }

    public long getProdutosVencidosCount() {
        return produtosVencidosCount;
    }

    public void setProdutosVencidosCount(long produtosVencidosCount) {
        this.produtosVencidosCount = produtosVencidosCount;
    }
}
