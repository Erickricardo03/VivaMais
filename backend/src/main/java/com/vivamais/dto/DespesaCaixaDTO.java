package com.vivamais.dto;

import com.vivamais.model.CategoriaDespesa;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class DespesaCaixaDTO {

    @NotBlank(message = "A descrição da despesa é obrigatória")
    private String descricao;

    @NotNull(message = "A categoria da despesa é obrigatória")
    private CategoriaDespesa categoria;

    @NotNull(message = "O valor da despesa é obrigatório")
    @Positive(message = "O valor da despesa deve ser maior que zero")
    private BigDecimal valor;

    public DespesaCaixaDTO() {
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public CategoriaDespesa getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaDespesa categoria) {
        this.categoria = categoria;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }
}
