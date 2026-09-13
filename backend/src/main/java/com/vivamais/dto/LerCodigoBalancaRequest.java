package com.vivamais.dto;

import jakarta.validation.constraints.NotBlank;

public class LerCodigoBalancaRequest {

    @NotBlank(message = "O código lido é obrigatório")
    private String codigo;

    public LerCodigoBalancaRequest() {
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }
}
