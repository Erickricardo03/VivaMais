package com.vivamais.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public class FecharCaixaDTO {

    @NotNull(message = "O valor contado no caixa é obrigatório")
    @PositiveOrZero(message = "O valor contado não pode ser negativo")
    private BigDecimal valorContado;

    private String observacoes;

    public FecharCaixaDTO() {
    }

    public BigDecimal getValorContado() {
        return valorContado;
    }

    public void setValorContado(BigDecimal valorContado) {
        this.valorContado = valorContado;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }
}
