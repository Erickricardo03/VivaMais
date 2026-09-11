package com.vivamais.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "caixas")
public class Caixa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String operador;

    @Column(nullable = false)
    private LocalDateTime dataAbertura;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorAbertura = BigDecimal.ZERO;

    private LocalDateTime dataFechamento;

    @Column(nullable = false, length = 20)
    private String status = "ABERTO"; // ABERTO, FECHADO

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal vendasDinheiro = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal vendasPix = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal vendasCartaoCredito = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal vendasCartaoDebito = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer quantidadeVendas = 0;

    @Column(precision = 12, scale = 2)
    private BigDecimal valorContadoFechamento;

    @Column(precision = 12, scale = 2)
    private BigDecimal saldoEsperadoFechamento;

    @Column(precision = 12, scale = 2)
    private BigDecimal diferencaFechamento;

    @Column(length = 500)
    private String observacoesFechamento;

    @OneToMany(mappedBy = "caixa", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<DespesaCaixa> despesas = new ArrayList<>();

    public Caixa() {
        this.dataAbertura = LocalDateTime.now();
    }

    public void adicionarDespesa(DespesaCaixa despesa) {
        despesas.add(despesa);
        despesa.setCaixa(this);
    }

    @Transient
    public BigDecimal getTotalDespesas() {
        return despesas.stream().map(DespesaCaixa::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transient
    public BigDecimal getSaldoEsperadoDinheiro() {
        return valorAbertura.add(vendasDinheiro).subtract(getTotalDespesas());
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOperador() {
        return operador;
    }

    public void setOperador(String operador) {
        this.operador = operador;
    }

    public LocalDateTime getDataAbertura() {
        return dataAbertura;
    }

    public void setDataAbertura(LocalDateTime dataAbertura) {
        this.dataAbertura = dataAbertura;
    }

    public BigDecimal getValorAbertura() {
        return valorAbertura;
    }

    public void setValorAbertura(BigDecimal valorAbertura) {
        this.valorAbertura = valorAbertura;
    }

    public LocalDateTime getDataFechamento() {
        return dataFechamento;
    }

    public void setDataFechamento(LocalDateTime dataFechamento) {
        this.dataFechamento = dataFechamento;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getVendasDinheiro() {
        return vendasDinheiro;
    }

    public void setVendasDinheiro(BigDecimal vendasDinheiro) {
        this.vendasDinheiro = vendasDinheiro;
    }

    public BigDecimal getVendasPix() {
        return vendasPix;
    }

    public void setVendasPix(BigDecimal vendasPix) {
        this.vendasPix = vendasPix;
    }

    public BigDecimal getVendasCartaoCredito() {
        return vendasCartaoCredito;
    }

    public void setVendasCartaoCredito(BigDecimal vendasCartaoCredito) {
        this.vendasCartaoCredito = vendasCartaoCredito;
    }

    public BigDecimal getVendasCartaoDebito() {
        return vendasCartaoDebito;
    }

    public void setVendasCartaoDebito(BigDecimal vendasCartaoDebito) {
        this.vendasCartaoDebito = vendasCartaoDebito;
    }

    public Integer getQuantidadeVendas() {
        return quantidadeVendas;
    }

    public void setQuantidadeVendas(Integer quantidadeVendas) {
        this.quantidadeVendas = quantidadeVendas;
    }

    public BigDecimal getValorContadoFechamento() {
        return valorContadoFechamento;
    }

    public void setValorContadoFechamento(BigDecimal valorContadoFechamento) {
        this.valorContadoFechamento = valorContadoFechamento;
    }

    public BigDecimal getSaldoEsperadoFechamento() {
        return saldoEsperadoFechamento;
    }

    public void setSaldoEsperadoFechamento(BigDecimal saldoEsperadoFechamento) {
        this.saldoEsperadoFechamento = saldoEsperadoFechamento;
    }

    public BigDecimal getDiferencaFechamento() {
        return diferencaFechamento;
    }

    public void setDiferencaFechamento(BigDecimal diferencaFechamento) {
        this.diferencaFechamento = diferencaFechamento;
    }

    public String getObservacoesFechamento() {
        return observacoesFechamento;
    }

    public void setObservacoesFechamento(String observacoesFechamento) {
        this.observacoesFechamento = observacoesFechamento;
    }

    public List<DespesaCaixa> getDespesas() {
        return despesas;
    }

    public void setDespesas(List<DespesaCaixa> despesas) {
        this.despesas = despesas;
    }
}
