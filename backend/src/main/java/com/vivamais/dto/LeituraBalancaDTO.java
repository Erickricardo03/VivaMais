package com.vivamais.dto;

import java.math.BigDecimal;

/** Resultado da leitura de uma etiqueta de balança já resolvido para um produto do catálogo,
 *  pronto para o operador conferir na tela antes de confirmar a adição ao carrinho. */
public class LeituraBalancaDTO {

    private Long produtoId;
    private String nomeProduto;
    private String unidade;
    private String codigoProduto;
    private BigDecimal precoVenda;
    private BigDecimal valorLido;
    private BigDecimal pesoCalculado;

    public Long getProdutoId() {
        return produtoId;
    }

    public void setProdutoId(Long produtoId) {
        this.produtoId = produtoId;
    }

    public String getNomeProduto() {
        return nomeProduto;
    }

    public void setNomeProduto(String nomeProduto) {
        this.nomeProduto = nomeProduto;
    }

    public String getUnidade() {
        return unidade;
    }

    public void setUnidade(String unidade) {
        this.unidade = unidade;
    }

    public String getCodigoProduto() {
        return codigoProduto;
    }

    public void setCodigoProduto(String codigoProduto) {
        this.codigoProduto = codigoProduto;
    }

    public BigDecimal getPrecoVenda() {
        return precoVenda;
    }

    public void setPrecoVenda(BigDecimal precoVenda) {
        this.precoVenda = precoVenda;
    }

    public BigDecimal getValorLido() {
        return valorLido;
    }

    public void setValorLido(BigDecimal valorLido) {
        this.valorLido = valorLido;
    }

    public BigDecimal getPesoCalculado() {
        return pesoCalculado;
    }

    public void setPesoCalculado(BigDecimal pesoCalculado) {
        this.pesoCalculado = pesoCalculado;
    }
}
