package com.vivamais.service;

import com.vivamais.dto.AbrirCaixaDTO;
import com.vivamais.dto.DespesaCaixaDTO;
import com.vivamais.dto.FecharCaixaDTO;
import com.vivamais.model.Caixa;
import com.vivamais.model.DespesaCaixa;
import com.vivamais.model.FormaPagamento;
import com.vivamais.model.Venda;
import com.vivamais.repository.CaixaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class CaixaService {

    private static final String STATUS_ABERTO = "ABERTO";
    private static final String STATUS_FECHADO = "FECHADO";

    private final CaixaRepository caixaRepository;

    public CaixaService(CaixaRepository caixaRepository) {
        this.caixaRepository = caixaRepository;
    }

    public Optional<Caixa> buscarCaixaAberto() {
        return caixaRepository.findByStatus(STATUS_ABERTO);
    }

    public Caixa getCaixaAbertoOuFalhar() {
        return buscarCaixaAberto()
                .orElseThrow(() -> new IllegalStateException("Nenhum caixa aberto. Abra o caixa antes de vender."));
    }

    @Transactional
    public Caixa abrirCaixa(AbrirCaixaDTO dto) {
        if (buscarCaixaAberto().isPresent()) {
            throw new IllegalStateException("Já existe um caixa aberto. Feche o caixa atual antes de abrir um novo.");
        }

        Caixa caixa = new Caixa();
        caixa.setOperador(dto.getOperador() != null && !dto.getOperador().isBlank() ? dto.getOperador() : "Operador");
        caixa.setValorAbertura(dto.getValorAbertura() != null ? dto.getValorAbertura() : BigDecimal.ZERO);
        caixa.setStatus(STATUS_ABERTO);
        return caixaRepository.save(caixa);
    }

    @Transactional
    public void registrarVenda(Caixa caixa, Venda venda) {
        BigDecimal valor = venda.getValorTotal();

        if (venda.getFormaPagamento() == FormaPagamento.DINHEIRO) {
            caixa.setVendasDinheiro(caixa.getVendasDinheiro().add(valor));
        } else if (venda.getFormaPagamento() == FormaPagamento.PIX) {
            caixa.setVendasPix(caixa.getVendasPix().add(valor));
        } else if (venda.getFormaPagamento() == FormaPagamento.CARTAO_CREDITO) {
            caixa.setVendasCartaoCredito(caixa.getVendasCartaoCredito().add(valor));
        } else if (venda.getFormaPagamento() == FormaPagamento.CARTAO_DEBITO) {
            caixa.setVendasCartaoDebito(caixa.getVendasCartaoDebito().add(valor));
        }

        caixa.setQuantidadeVendas(caixa.getQuantidadeVendas() + 1);
        caixaRepository.save(caixa);
    }

    @Transactional
    public Caixa adicionarDespesa(DespesaCaixaDTO dto) {
        Caixa caixa = getCaixaAbertoOuFalhar();

        DespesaCaixa despesa = new DespesaCaixa();
        despesa.setDescricao(dto.getDescricao());
        despesa.setCategoria(dto.getCategoria());
        despesa.setValor(dto.getValor());
        caixa.adicionarDespesa(despesa);

        return caixaRepository.save(caixa);
    }

    @Transactional
    public Caixa removerDespesa(Long despesaId) {
        Caixa caixa = getCaixaAbertoOuFalhar();
        boolean removida = caixa.getDespesas().removeIf(d -> d.getId().equals(despesaId));
        if (!removida) {
            throw new RuntimeException("Despesa não encontrada no caixa aberto atual.");
        }
        return caixaRepository.save(caixa);
    }

    @Transactional
    public Caixa fecharCaixa(FecharCaixaDTO dto) {
        Caixa caixa = getCaixaAbertoOuFalhar();

        BigDecimal saldoEsperado = caixa.getSaldoEsperadoDinheiro();
        BigDecimal valorContado = dto.getValorContado() != null ? dto.getValorContado() : BigDecimal.ZERO;

        caixa.setStatus(STATUS_FECHADO);
        caixa.setDataFechamento(java.time.LocalDateTime.now());
        caixa.setValorContadoFechamento(valorContado);
        caixa.setSaldoEsperadoFechamento(saldoEsperado);
        caixa.setDiferencaFechamento(valorContado.subtract(saldoEsperado));
        caixa.setObservacoesFechamento(dto.getObservacoes());

        return caixaRepository.save(caixa);
    }

    public List<Caixa> listarHistorico() {
        return caixaRepository.findByStatusOrderByDataFechamentoDesc(STATUS_FECHADO);
    }
}
