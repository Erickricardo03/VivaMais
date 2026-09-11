package com.vivamais.service;

import com.vivamais.dto.*;
import com.vivamais.model.ItemVenda;
import com.vivamais.model.Venda;
import com.vivamais.repository.ProdutoRepository;
import com.vivamais.repository.VendaRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class DashboardService {

    private final VendaRepository vendaRepository;
    private final ProdutoRepository produtoRepository;
    private final VendaService vendaService;

    public DashboardService(VendaRepository vendaRepository,
                            ProdutoRepository produtoRepository,
                            VendaService vendaService) {
        this.vendaRepository = vendaRepository;
        this.produtoRepository = produtoRepository;
        this.vendaService = vendaService;
    }

    public DashboardResumoDTO obterResumo() {
        LocalDate hoje = LocalDate.now();
        LocalDateTime inicioHoje = hoje.atStartOfDay();
        LocalDateTime fimHoje = hoje.atTime(LocalTime.MAX);

        LocalDateTime inicioSemana = hoje.minusDays(6).atStartOfDay();
        LocalDateTime inicioMes = YearMonth.from(hoje).atDay(1).atStartOfDay();
        LocalDateTime inicioAno = LocalDate.of(hoje.getYear(), 1, 1).atStartOfDay();

        DashboardResumoDTO resumo = new DashboardResumoDTO();

        // Hoje
        resumo.setFaturamentoHoje(vendaRepository.sumFaturamentoBetween(inicioHoje, fimHoje));
        resumo.setVendasHoje(vendaRepository.countVendasBetween(inicioHoje, fimHoje));
        if (resumo.getVendasHoje() > 0) {
            resumo.setTicketMedioHoje(resumo.getFaturamentoHoje().divide(BigDecimal.valueOf(resumo.getVendasHoje()), 2, RoundingMode.HALF_UP));
        }

        // Semana
        resumo.setFaturamentoSemana(vendaRepository.sumFaturamentoBetween(inicioSemana, fimHoje));
        resumo.setVendasSemana(vendaRepository.countVendasBetween(inicioSemana, fimHoje));

        // Mês
        resumo.setFaturamentoMes(vendaRepository.sumFaturamentoBetween(inicioMes, fimHoje));
        resumo.setVendasMes(vendaRepository.countVendasBetween(inicioMes, fimHoje));
        if (resumo.getVendasMes() > 0) {
            resumo.setTicketMedioMes(resumo.getFaturamentoMes().divide(BigDecimal.valueOf(resumo.getVendasMes()), 2, RoundingMode.HALF_UP));
        }

        // Ano
        resumo.setFaturamentoAno(vendaRepository.sumFaturamentoBetween(inicioAno, fimHoje));
        resumo.setVendasAno(vendaRepository.countVendasBetween(inicioAno, fimHoje));

        // Alertas e Estoque
        resumo.setTotalProdutosCadastrados(produtoRepository.countByAtivoTrue());
        resumo.setProdutosEstoqueBaixoCount(produtoRepository.countProdutosComEstoqueBaixo());
        resumo.setProdutosVencidosCount(produtoRepository.countProdutosVencidos(hoje));
        resumo.setProdutosVencendoCount(produtoRepository.countProdutosVencendoEmBreve(hoje, hoje.plusDays(30)));

        return resumo;
    }

    public FaturamentoPeriodoDTO obterFaturamentoFiltrado(String periodo, String inicioStr, String fimStr) {
        LocalDate hoje = LocalDate.now();
        LocalDateTime inicio;
        LocalDateTime fim;

        String periodoNormalizado = (periodo != null) ? periodo.toUpperCase() : "MENSAL";

        switch (periodoNormalizado) {
            case "DIARIO":
                if (inicioStr != null && !inicioStr.isEmpty()) {
                    LocalDate dt = LocalDate.parse(inicioStr);
                    inicio = dt.atStartOfDay();
                    fim = dt.atTime(LocalTime.MAX);
                } else {
                    inicio = hoje.atStartOfDay();
                    fim = hoje.atTime(LocalTime.MAX);
                }
                break;
            case "SEMANAL":
                inicio = hoje.minusDays(6).atStartOfDay();
                fim = hoje.atTime(LocalTime.MAX);
                break;
            case "ANUAL":
                inicio = LocalDate.of(hoje.getYear(), 1, 1).atStartOfDay();
                fim = LocalDate.of(hoje.getYear(), 12, 31).atTime(LocalTime.MAX);
                break;
            case "CUSTOM":
                if (inicioStr != null && !inicioStr.isEmpty()) {
                    inicio = LocalDate.parse(inicioStr).atStartOfDay();
                } else {
                    inicio = hoje.minusDays(30).atStartOfDay();
                }
                if (fimStr != null && !fimStr.isEmpty()) {
                    fim = LocalDate.parse(fimStr).atTime(LocalTime.MAX);
                } else {
                    fim = hoje.atTime(LocalTime.MAX);
                }
                break;
            case "MENSAL":
            default:
                periodoNormalizado = "MENSAL";
                YearMonth ym = (inicioStr != null && !inicioStr.isEmpty()) ? YearMonth.parse(inicioStr) : YearMonth.from(hoje);
                inicio = ym.atDay(1).atStartOfDay();
                fim = ym.atEndOfMonth().atTime(LocalTime.MAX);
                break;
        }

        List<Venda> vendas = vendaRepository.findByDataHoraBetweenAndStatusOrderByDataHoraDesc(inicio, fim, "CONCLUIDA");

        FaturamentoPeriodoDTO resultado = new FaturamentoPeriodoDTO();
        resultado.setPeriodo(periodoNormalizado);
        resultado.setDataInicio(inicio.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        resultado.setDataFim(fim.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        resultado.setQuantidadeVendas(vendas.size());

        BigDecimal faturamentoTotal = BigDecimal.ZERO;
        BigDecimal custoTotal = BigDecimal.ZERO;
        Map<String, Double> rankingQtd = new HashMap<>();
        Map<String, BigDecimal> rankingValor = new HashMap<>();

        for (Venda v : vendas) {
            faturamentoTotal = faturamentoTotal.add(v.getValorTotal());

            for (ItemVenda item : v.getItens()) {
                BigDecimal custoItem = item.getProduto().getPrecoCusto() != null
                        ? item.getProduto().getPrecoCusto().multiply(BigDecimal.valueOf(item.getQuantidade()))
                        : BigDecimal.ZERO;
                custoTotal = custoTotal.add(custoItem);

                String nomeProd = item.getNomeProduto();
                rankingQtd.put(nomeProd, rankingQtd.getOrDefault(nomeProd, 0.0) + item.getQuantidade());
                rankingValor.put(nomeProd, rankingValor.getOrDefault(nomeProd, BigDecimal.ZERO).add(item.getSubtotal()));
            }
        }

        resultado.setFaturamentoTotal(faturamentoTotal);
        resultado.setCustoTotal(custoTotal);

        BigDecimal lucroEstimado = faturamentoTotal.subtract(custoTotal);
        resultado.setLucroEstimado(lucroEstimado);

        if (faturamentoTotal.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal margem = lucroEstimado.multiply(BigDecimal.valueOf(100))
                    .divide(faturamentoTotal, 2, RoundingMode.HALF_UP);
            resultado.setMargemLucroPercentual(margem.doubleValue());
        }

        if (!vendas.isEmpty()) {
            resultado.setTicketMedio(faturamentoTotal.divide(BigDecimal.valueOf(vendas.size()), 2, RoundingMode.HALF_UP));
        }

        // Montar pontos do gráfico temporal
        resultado.setPontosGrafico(gerarPontosGrafico(periodoNormalizado, inicio, fim, vendas));

        // Montar ranking dos produtos
        List<RankingProdutoDTO> ranking = new ArrayList<>();
        rankingQtd.entrySet().stream()
                .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()))
                .limit(8)
                .forEach(e -> ranking.add(new RankingProdutoDTO(e.getKey(), e.getValue(), rankingValor.get(e.getKey()))));
        resultado.setRankingProdutos(ranking);

        // Vendas no período (máximo 50)
        List<VendaResponseDTO> vendasDTO = new ArrayList<>();
        for (int i = 0; i < Math.min(vendas.size(), 50); i++) {
            vendasDTO.add(vendaService.converterParaResponseDTO(vendas.get(i)));
        }
        resultado.setVendas(vendasDTO);

        return resultado;
    }

    private List<PontoGraficoDTO> gerarPontosGrafico(String periodo, LocalDateTime inicio, LocalDateTime fim, List<Venda> vendas) {
        List<PontoGraficoDTO> pontos = new ArrayList<>();

        if ("DIARIO".equals(periodo)) {
            // Agrupar por blocos de 2 horas (08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00)
            int[] horas = {8, 10, 12, 14, 16, 18, 20};
            for (int h : horas) {
                String label = String.format("%02d:00", h);
                BigDecimal totalHora = BigDecimal.ZERO;
                long qtdHora = 0;

                for (Venda v : vendas) {
                    int vH = v.getDataHora().getHour();
                    if (vH >= h && vH < h + 2) {
                        totalHora = totalHora.add(v.getValorTotal());
                        qtdHora++;
                    }
                }
                pontos.add(new PontoGraficoDTO(label, label, totalHora, qtdHora));
            }
        } else if ("SEMANAL".equals(periodo) || "CUSTOM".equals(periodo)) {
            // Dia a dia
            LocalDate cur = inicio.toLocalDate();
            LocalDate end = fim.toLocalDate();
            DateTimeFormatter fmtLabel = DateTimeFormatter.ofPattern("dd/MM");
            DateTimeFormatter fmtNomeDia = DateTimeFormatter.ofPattern("EEE", new Locale("pt", "BR"));

            while (!cur.isAfter(end)) {
                String label = cur.format(fmtLabel) + " (" + cur.format(fmtNomeDia) + ")";
                String dataCompleta = cur.toString();
                BigDecimal totalDia = BigDecimal.ZERO;
                long qtdDia = 0;

                for (Venda v : vendas) {
                    if (v.getDataHora().toLocalDate().equals(cur)) {
                        totalDia = totalDia.add(v.getValorTotal());
                        qtdDia++;
                    }
                }
                pontos.add(new PontoGraficoDTO(label, dataCompleta, totalDia, qtdDia));
                cur = cur.plusDays(1);
            }
        } else if ("MENSAL".equals(periodo)) {
            // Dias do mês agrupados de 2 em 2 ou diários
            LocalDate cur = inicio.toLocalDate();
            LocalDate end = fim.toLocalDate();
            DateTimeFormatter fmtLabel = DateTimeFormatter.ofPattern("dd/MM");

            while (!cur.isAfter(end)) {
                String label = cur.format(fmtLabel);
                String dataCompleta = cur.toString();
                BigDecimal totalDia = BigDecimal.ZERO;
                long qtdDia = 0;

                for (Venda v : vendas) {
                    if (v.getDataHora().toLocalDate().equals(cur)) {
                        totalDia = totalDia.add(v.getValorTotal());
                        qtdDia++;
                    }
                }
                pontos.add(new PontoGraficoDTO(label, dataCompleta, totalDia, qtdDia));
                cur = cur.plusDays(1);
            }
        } else if ("ANUAL".equals(periodo)) {
            // 12 meses (Jan a Dez)
            int ano = inicio.getYear();
            String[] meses = {"Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"};

            for (int m = 1; m <= 12; m++) {
                String label = meses[m - 1];
                String dataCompleta = String.format("%d-%02d", ano, m);
                BigDecimal totalMes = BigDecimal.ZERO;
                long qtdMes = 0;

                for (Venda v : vendas) {
                    if (v.getDataHora().getYear() == ano && v.getDataHora().getMonthValue() == m) {
                        totalMes = totalMes.add(v.getValorTotal());
                        qtdMes++;
                    }
                }
                pontos.add(new PontoGraficoDTO(label, dataCompleta, totalMes, qtdMes));
            }
        }

        return pontos;
    }
}
