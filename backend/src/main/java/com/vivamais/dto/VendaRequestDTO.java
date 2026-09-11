package com.vivamais.dto;

import com.vivamais.model.FormaPagamento;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class VendaRequestDTO {

    @NotEmpty(message = "A venda deve conter pelo menos um item")
    @Valid
    private List<ItemVendaDTO> itens;

    @NotNull(message = "A forma de pagamento é obrigatória")
    private FormaPagamento formaPagamento;

    private BigDecimal desconto = BigDecimal.ZERO;

    private BigDecimal valorRecebido;

    private Long clienteId;

    public VendaRequestDTO() {
    }

    public List<ItemVendaDTO> getItens() {
        return itens;
    }

    public void setItens(List<ItemVendaDTO> itens) {
        this.itens = itens;
    }

    public FormaPagamento getFormaPagamento() {
        return formaPagamento;
    }

    public void setFormaPagamento(FormaPagamento formaPagamento) {
        this.formaPagamento = formaPagamento;
    }

    public BigDecimal getDesconto() {
        return desconto;
    }

    public void setDesconto(BigDecimal desconto) {
        this.desconto = desconto;
    }

    public BigDecimal getValorRecebido() {
        return valorRecebido;
    }

    public void setValorRecebido(BigDecimal valorRecebido) {
        this.valorRecebido = valorRecebido;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }
}
