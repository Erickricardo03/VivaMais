package com.vivamais.dto;

import com.vivamais.model.TipoMovimentacao;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class AjusteEstoqueDTO {

    @NotNull(message = "O tipo de movimentação é obrigatório")
    private TipoMovimentacao tipo;

    @NotNull(message = "A quantidade é obrigatória")
    @Positive(message = "A quantidade deve ser maior que zero")
    private Double quantidade;

    private String motivo;

    public AjusteEstoqueDTO() {
    }

    public AjusteEstoqueDTO(TipoMovimentacao tipo, Double quantidade, String motivo) {
        this.tipo = tipo;
        this.quantidade = quantidade;
        this.motivo = motivo;
    }

    public TipoMovimentacao getTipo() {
        return tipo;
    }

    public void setTipo(TipoMovimentacao tipo) {
        this.tipo = tipo;
    }

    public Double getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Double quantidade) {
        this.quantidade = quantidade;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}
