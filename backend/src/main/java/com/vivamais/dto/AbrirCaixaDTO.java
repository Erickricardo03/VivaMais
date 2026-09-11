package com.vivamais.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public class AbrirCaixaDTO {

    @NotNull(message = "O valor de abertura é obrigatório")
    @PositiveOrZero(message = "O valor de abertura não pode ser negativo")
    private BigDecimal valorAbertura;

    private String operador;

    public AbrirCaixaDTO() {
    }

    public BigDecimal getValorAbertura() {
        return valorAbertura;
    }

    public void setValorAbertura(BigDecimal valorAbertura) {
        this.valorAbertura = valorAbertura;
    }

    public String getOperador() {
        return operador;
    }

    public void setOperador(String operador) {
        this.operador = operador;
    }
}
