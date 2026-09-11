package com.vivamais.dto;

import java.math.BigDecimal;

public class PontoGraficoDTO {

    private String label; // "10/09", "Seg", "Setembro"
    private String dataCompleta; // "2026-09-10"
    private BigDecimal valor;
    private long quantidadeVendas;

    public PontoGraficoDTO() {
    }

    public PontoGraficoDTO(String label, String dataCompleta, BigDecimal valor, long quantidadeVendas) {
        this.label = label;
        this.dataCompleta = dataCompleta;
        this.valor = valor;
        this.quantidadeVendas = quantidadeVendas;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getDataCompleta() {
        return dataCompleta;
    }

    public void setDataCompleta(String dataCompleta) {
        this.dataCompleta = dataCompleta;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public long getQuantidadeVendas() {
        return quantidadeVendas;
    }

    public void setQuantidadeVendas(long quantidadeVendas) {
        this.quantidadeVendas = quantidadeVendas;
    }
}
