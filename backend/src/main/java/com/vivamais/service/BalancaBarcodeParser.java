package com.vivamais.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Interpreta o código de barras EAN-13 impresso pela balança de precificação
 * (padrão "código reverso" usado por Toledo/Prix e similares).
 *
 * Layout fixo de 13 dígitos:
 *   posição 1        -> dígito indicador de produto pesável (fixo, ex: "2")
 *   posições 2 a 6    -> código do produto cadastrado na balança (5 dígitos)
 *   posições 7 a 12   -> valor total da pesagem, em centavos (6 dígitos)
 *   posição 13        -> dígito verificador (checksum padrão EAN-13)
 *
 * O peso não vem embutido no código — é calculado depois, dividindo o valor
 * total lido pelo preço por kg já cadastrado no produto.
 */
@Component
public class BalancaBarcodeParser {

    private static final int TAMANHO_TOTAL = 13;

    @Value("${vivamais.balanca.digito-indicador:2}")
    private char digitoIndicador;

    @Value("${vivamais.balanca.tamanho-codigo-produto:5}")
    private int tamanhoCodigoProduto;

    @Value("${vivamais.balanca.tamanho-valor-centavos:6}")
    private int tamanhoValorCentavos;

    /** Checagem rápida e barata, usada para decidir se um código escaneado deve seguir o fluxo de balança. */
    public boolean pareceCodigoBalanca(String codigo) {
        return codigo != null
                && codigo.length() == TAMANHO_TOTAL
                && somenteDigitos(codigo)
                && codigo.charAt(0) == digitoIndicador;
    }

    public LeituraBalanca ler(String codigo) {
        if (codigo == null || codigo.length() != TAMANHO_TOTAL || !somenteDigitos(codigo)) {
            throw new IllegalArgumentException("Código de barras inválido: esperado um código numérico de " + TAMANHO_TOTAL + " dígitos.");
        }
        if (codigo.charAt(0) != digitoIndicador) {
            throw new IllegalArgumentException("Este código não é de uma etiqueta de balança (deveria começar com '" + digitoIndicador + "').");
        }
        if (1 + tamanhoCodigoProduto + tamanhoValorCentavos != TAMANHO_TOTAL - 1) {
            throw new IllegalStateException("Configuração de tamanhos de campo da balança está inconsistente com o total de 13 dígitos.");
        }
        if (!digitoVerificadorValido(codigo)) {
            throw new IllegalArgumentException("Dígito verificador inválido — a etiqueta pode estar rasgada, amassada ou mal lida. Tente escanear novamente.");
        }

        int inicioCodigoProduto = 1;
        int fimCodigoProduto = inicioCodigoProduto + tamanhoCodigoProduto;
        int fimValor = fimCodigoProduto + tamanhoValorCentavos;

        String codigoProduto = codigo.substring(inicioCodigoProduto, fimCodigoProduto);
        String valorCentavosStr = codigo.substring(fimCodigoProduto, fimValor);
        BigDecimal valorTotal = new BigDecimal(valorCentavosStr).movePointLeft(2);

        return new LeituraBalanca(codigoProduto, valorTotal);
    }

    private boolean somenteDigitos(String s) {
        for (int i = 0; i < s.length(); i++) {
            if (!Character.isDigit(s.charAt(i))) return false;
        }
        return true;
    }

    private boolean digitoVerificadorValido(String codigo) {
        int soma = 0;
        for (int i = 0; i < TAMANHO_TOTAL - 1; i++) {
            int digito = codigo.charAt(i) - '0';
            soma += (i % 2 == 0) ? digito : digito * 3;
        }
        int digitoCalculado = (10 - (soma % 10)) % 10;
        int digitoInformado = codigo.charAt(TAMANHO_TOTAL - 1) - '0';
        return digitoCalculado == digitoInformado;
    }

    public record LeituraBalanca(String codigoProduto, BigDecimal valorTotal) {
    }
}
