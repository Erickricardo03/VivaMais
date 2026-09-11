package com.vivamais.dto;

import java.math.BigDecimal;

public class RankingProdutoDTO {

    private String nome;
    private Double quantidade;
    private BigDecimal valorTotal;

    public RankingProdutoDTO() {
    }

    public RankingProdutoDTO(String nome, Double quantidade, BigDecimal valorTotal) {
        this.nome = nome;
        this.quantidade = quantidade;
        this.valorTotal = valorTotal;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Double getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Double quantidade) {
        this.quantidade = quantidade;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
    }
}
