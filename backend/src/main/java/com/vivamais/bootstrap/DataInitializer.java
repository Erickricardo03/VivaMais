package com.vivamais.bootstrap;

import com.vivamais.model.*;
import com.vivamais.repository.ClienteRepository;
import com.vivamais.repository.MovimentacaoEstoqueRepository;
import com.vivamais.repository.ProdutoRepository;
import com.vivamais.repository.UsuarioRepository;
import com.vivamais.repository.VendaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;
    private final VendaRepository vendaRepository;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final ClienteRepository clienteRepository;

    public DataInitializer(UsuarioRepository usuarioRepository,
                           ProdutoRepository produtoRepository,
                           VendaRepository vendaRepository,
                           MovimentacaoEstoqueRepository movimentacaoRepository,
                           ClienteRepository clienteRepository) {
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
        this.vendaRepository = vendaRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.clienteRepository = clienteRepository;
    }

    @Override
    public void run(String... args) {
        inicializarUsuarios();
        if (produtoRepository.count() == 0) {
            List<Produto> produtos = inicializarProdutos();
            inicializarVendasHistoricas(produtos);
        }
        if (clienteRepository.count() == 0) {
            inicializarClientes();
        }
        vincularCodigoBalancaDeExemplo();
    }

    /** Idempotente: garante o código de balança de exemplo mesmo em bancos já existentes
     *  (onde inicializarProdutos() não roda de novo por já haver produtos cadastrados). */
    private void vincularCodigoBalancaDeExemplo() {
        produtoRepository.findByCodigoBarrasAndAtivoTrue("7891000200018").ifPresent(produto -> {
            if (produto.getCodigoBalanca() == null || produto.getCodigoBalanca().isBlank()) {
                produto.setCodigoBalanca("01580");
                produtoRepository.save(produto);
            }
        });
    }

    private void inicializarUsuarios() {
        if (usuarioRepository.findByUsername("admin").isEmpty()) {
            Usuario admin = new Usuario("admin", "admin", "Administrador VivaMais", "Gerente Geral");
            usuarioRepository.save(admin);
        }
    }

    private List<Produto> inicializarProdutos() {
        LocalDate hoje = LocalDate.now();
        List<Produto> lista = new ArrayList<>();

        // 1. Chás Especiais
        lista.add(new Produto("Chá Verde com Gengibre e Limão 100g", "7891000100011", "Chás e Ervas",
                "Blend energizante de chá verde com gengibre e raspas de limão", "PCT",
                new BigDecimal("8.50"), new BigDecimal("18.90"), 35.0, 10.0, hoje.plusMonths(10), "L-CV2026"));

        lista.add(new Produto("Chá de Camomila Orgânica 50g", "7891000100028", "Chás e Ervas",
                "Flores selecionadas de camomila para infusão relaxante", "PCT",
                new BigDecimal("5.20"), new BigDecimal("12.50"), 4.0, 10.0, hoje.plusMonths(8), "L-CAM2026")); // ESTOQUE BAIXO (4 <= 10)

        lista.add(new Produto("Chá Hibisco Flor Inteira 100g", "7891000100035", "Chás e Ervas",
                "Flores desidratadas de hibisco puro, rico em antioxidantes", "PCT",
                new BigDecimal("6.00"), new BigDecimal("14.90"), 28.0, 8.0, hoje.plusDays(12), "L-HIB2025")); // VALIDADE CRÍTICA (12 dias)

        // 2. Grãos, Sementes e Castanhas
        Produto castanhaPara = new Produto("Castanha-do-Pará Selecionada", "7891000200018", "Castanhas e Grãos",
                "Castanhas inteiras frescas da Amazônia a granel", "KG",
                new BigDecimal("58.00"), new BigDecimal("98.00"), 3.5, 8.0, hoje.plusMonths(6), "L-CP2026"); // ESTOQUE BAIXO (3.5 <= 8.0)
        castanhaPara.setCodigoBalanca("01580"); // código de exemplo usado para testar a leitura de etiqueta da balança
        lista.add(castanhaPara);

        lista.add(new Produto("Castanha de Caju W1 Torrada sem Sal", "7891000200025", "Castanhas e Grãos",
                "Castanhas de caju selecionadas de primeira linha", "KG",
                new BigDecimal("62.00"), new BigDecimal("110.00"), 18.0, 5.0, hoje.plusMonths(7), "L-CC2026"));

        lista.add(new Produto("Semente de Chia Orgânica 250g", "7891000200032", "Castanhas e Grãos",
                "Rica em ômega 3, fibras e proteínas vegetais", "PCT",
                new BigDecimal("7.50"), new BigDecimal("16.90"), 22.0, 6.0, hoje.plusMonths(12), "L-CHI2026"));

        lista.add(new Produto("Quinoa Real em Grãos 500g", "7891000200049", "Castanhas e Grãos",
                "Grãos andinos ricos em todos os aminoácidos essenciais", "PCT",
                new BigDecimal("11.00"), new BigDecimal("24.90"), 15.0, 5.0, hoje.plusMonths(9), "L-QUI2026"));

        // 3. Farinhas e Fibras
        lista.add(new Produto("Psyllium Husk 100% Puro 200g", "7891000300015", "Farinhas e Fibras",
                "Fibra solúvel natural ideal para saúde digestiva e receitas cetogênicas", "PCT",
                new BigDecimal("14.00"), new BigDecimal("29.90"), 12.0, 5.0, hoje.plusMonths(11), "L-PSY2026"));

        lista.add(new Produto("Farinha de Amêndoas Pura 500g", "7891000300022", "Farinhas e Fibras",
                "Farinha fina de amêndoas sem casca, low carb", "PCT",
                new BigDecimal("22.00"), new BigDecimal("44.90"), 2.0, 6.0, hoje.plusMonths(5), "L-AMD2026")); // ESTOQUE BAIXO (2 <= 6)

        lista.add(new Produto("Farinha de Aveia Integral 500g", "7891000300039", "Farinhas e Fibras",
                "Fonte nobre de beta-glucana para controle de colesterol", "PCT",
                new BigDecimal("4.20"), new BigDecimal("9.90"), 40.0, 10.0, hoje.plusMonths(8), "L-AVE2026"));

        // 4. Mel, Própolis e Apícolas
        lista.add(new Produto("Mel Silvestre Puro Bisnaga 500g", "7891000400012", "Mel e Apícolas",
                "Mel cru colhido da floração silvestre de pequenos produtores", "UN",
                new BigDecimal("16.00"), new BigDecimal("32.90"), 3.0, 8.0, hoje.plusYears(2), "L-MEL2026")); // ESTOQUE BAIXO (3 <= 8)

        lista.add(new Produto("Extrato de Própolis Verde Alcoólico 30ml", "7891000400029", "Mel e Apícolas",
                "Concentrado padronizado de própolis verde brasileira com alta atividade", "UN",
                new BigDecimal("12.50"), new BigDecimal("26.90"), 25.0, 8.0, hoje.plusMonths(18), "L-PRP2026"));

        // 5. Suplementos Naturais
        lista.add(new Produto("Colágeno Hidrolisado Verisol 300g", "7891000500019", "Suplementos Naturais",
                "Peptídeos bioativos de colágeno para pele e articulações com sabor neutro", "POTE",
                new BigDecimal("45.00"), new BigDecimal("89.90"), 14.0, 5.0, hoje.plusMonths(14), "L-COL2026"));

        lista.add(new Produto("Creatina Monohidratada 100% Pura 300g", "7891000500026", "Suplementos Naturais",
                "Creatina micronizada sem sabor com altíssimo grau de pureza", "POTE",
                new BigDecimal("42.00"), new BigDecimal("84.90"), 19.0, 6.0, hoje.plusMonths(16), "L-CRE2026"));

        lista.add(new Produto("Spirulina Orgânica em Pó 150g", "7891000500033", "Suplementos Naturais",
                "Superalimento rico em clorofila, ferro e proteínas completas", "POTE",
                new BigDecimal("21.00"), new BigDecimal("46.90"), 8.0, 4.0, hoje.plusDays(24), "L-SPI2025")); // VALIDADE EM ALERTA (24 dias)

        lista.add(new Produto("Cloreto de Magnésio PA 100g", "7891000500040", "Suplementos Naturais",
                "Grau analítico de alta biodisponibilidade mineral", "PCT",
                new BigDecimal("3.50"), new BigDecimal("8.50"), 30.0, 8.0, hoje.plusMonths(24), "L-MAG2026"));

        // 6. Óleos e Encapsulados
        lista.add(new Produto("Óleo de Coco Extra Virgem 500ml", "7891000600016", "Óleos e Encapsulados",
                "Prensado a frio, acidez máxima 0,2%, aroma suave e natural", "UN",
                new BigDecimal("18.00"), new BigDecimal("38.90"), 16.0, 5.0, hoje.plusMonths(12), "L-COC2026"));

        lista.add(new Produto("Ômega 3 1000mg 120 Cápsulas", "7891000600023", "Óleos e Encapsulados",
                "Óleo de peixe purificado livre de metais pesados com EPA e DHA", "POTE",
                new BigDecimal("35.00"), new BigDecimal("74.90"), 1.0, 5.0, hoje.plusMonths(10), "L-OMG2026")); // ESTOQUE BAIXO (1 <= 5)

        lista.add(new Produto("Maca Peruana Negra 500mg 60 Cápsulas", "7891000600030", "Óleos e Encapsulados",
                "Extrato concentrado da raiz andina para vitalidade e equilíbrio", "POTE",
                new BigDecimal("22.00"), new BigDecimal("49.90"), 11.0, 4.0, hoje.plusMonths(15), "L-MAC2026"));

        // 7. Snacks Saudáveis
        lista.add(new Produto("Granola Artesanal com Castanhas 400g", "7891000700013", "Snacks Saudáveis",
                "Crocante e adoçada naturalmente com mel e açúcar de coco", "PCT",
                new BigDecimal("9.00"), new BigDecimal("21.90"), 5.0, 5.0, hoje.minusDays(4), "L-GRA2025")); // VENCIDO (venceu há 4 dias)

        lista.add(new Produto("Chips de Coco Queimado 80g", "7891000700020", "Snacks Saudáveis",
                "Fitas assadas de coco crocante sem conservantes", "PCT",
                new BigDecimal("6.50"), new BigDecimal("14.50"), 24.0, 6.0, hoje.plusMonths(4), "L-CHP2026"));

        List<Produto> salvos = new ArrayList<>();
        for (Produto p : lista) {
            Produto salvo = produtoRepository.save(p);
            salvos.add(salvo);

            MovimentacaoEstoque mov = new MovimentacaoEstoque(
                    salvo,
                    TipoMovimentacao.ENTRADA,
                    salvo.getEstoqueAtual(),
                    0.0,
                    salvo.getEstoqueAtual(),
                    "Estoque inicial de implantação"
            );
            movimentacaoRepository.save(mov);
        }

        return salvos;
    }

    private void inicializarClientes() {
        LocalDateTime agora = LocalDateTime.now();

        clienteRepository.save(criarCliente("Maria Aparecida Souza", "(11) 98765-4321", "maria.souza@email.com",
                agora.minusDays(220), agora.minusDays(95), 12, new BigDecimal("845.60")));

        clienteRepository.save(criarCliente("João Pedro Lima", "(11) 91234-5678", "joaopedro.lima@email.com",
                agora.minusDays(180), agora.minusDays(12), 8, new BigDecimal("412.30")));

        clienteRepository.save(criarCliente("Carla Fernandes", "(11) 99876-1122", "carla.fernandes@email.com",
                agora.minusDays(400), agora.minusDays(160), 20, new BigDecimal("1580.00")));

        clienteRepository.save(criarCliente("Roberto Alves", "(11) 97654-3210", null,
                agora.minusDays(60), agora.minusDays(5), 3, new BigDecimal("189.90")));

        clienteRepository.save(criarCliente("Fernanda Costa", "(11) 96543-2109", "fernanda.costa@email.com",
                agora.minusDays(300), agora.minusDays(45), 15, new BigDecimal("970.75")));

        clienteRepository.save(criarCliente("Antônio Ferreira", "(11) 95432-1098", null,
                agora.minusDays(500), agora.minusDays(210), 6, new BigDecimal("320.40")));
    }

    private Cliente criarCliente(String nome, String telefone, String email,
                                  LocalDateTime dataCadastro, LocalDateTime ultimaCompra,
                                  int totalCompras, BigDecimal valorTotalGasto) {
        Cliente c = new Cliente();
        c.setNome(nome);
        c.setTelefone(telefone);
        c.setEmail(email);
        c.setDataCadastro(dataCadastro);
        c.setUltimaCompra(ultimaCompra);
        c.setTotalCompras(totalCompras);
        c.setValorTotalGasto(valorTotalGasto);
        return c;
    }

    private void inicializarVendasHistoricas(List<Produto> produtos) {
        if (produtos.isEmpty()) return;

        LocalDate hoje = LocalDate.now();
        FormaPagamento[] formas = {FormaPagamento.PIX, FormaPagamento.CARTAO_CREDITO, FormaPagamento.DINHEIRO, FormaPagamento.CARTAO_DEBITO};

        // Gerar vendas nos últimos 28 dias
        int vendaSeq = 1;
        for (int diasAtras = 28; diasAtras >= 0; diasAtras--) {
            LocalDate dataVenda = hoje.minusDays(diasAtras);
            // Dias de semana têm mais movimento que finais de semana
            int numVendasDia = (dataVenda.getDayOfWeek().getValue() >= 6) ? 3 : 5;

            // No dia de hoje teremos mais vendas recentes
            if (diasAtras == 0) {
                numVendasDia = 8;
            }

            for (int v = 0; v < numVendasDia; v++) {
                int hora = 8 + (v * 11 / numVendasDia);
                int minuto = (v * 23) % 60;
                LocalDateTime dataHora = dataVenda.atTime(hora, minuto);

                Venda venda = new Venda();
                String codVenda = String.format("VM-%02d%02d-%04d", dataVenda.getMonthValue(), dataVenda.getDayOfMonth(), vendaSeq++);
                venda.setNumeroVenda(codVenda);
                venda.setDataHora(dataHora);
                venda.setFormaPagamento(formas[(vendaSeq + v) % formas.length]);

                // Selecionar 2 a 4 produtos aleatórios
                int itensCount = 2 + ((vendaSeq + v) % 3);
                BigDecimal subtotal = BigDecimal.ZERO;

                for (int i = 0; i < itensCount; i++) {
                    Produto p = produtos.get((vendaSeq * 3 + i * 5) % produtos.size());
                    double qtd = (p.getUnidade().equals("KG")) ? 0.5 : (1 + (i % 2));
                    ItemVenda item = new ItemVenda(p, qtd, p.getPrecoVenda());
                    venda.adicionarItem(item);
                    subtotal = subtotal.add(item.getSubtotal());
                }

                venda.setSubtotal(subtotal);
                BigDecimal desc = (vendaSeq % 4 == 0) ? new BigDecimal("5.00") : BigDecimal.ZERO;
                venda.setDesconto(desc);
                BigDecimal total = subtotal.subtract(desc);
                venda.setValorTotal(total);

                if (venda.getFormaPagamento() == FormaPagamento.DINHEIRO) {
                    BigDecimal recebido = total.add(BigDecimal.valueOf(10));
                    venda.setValorRecebido(recebido);
                    venda.setTroco(BigDecimal.valueOf(10));
                } else {
                    venda.setValorRecebido(total);
                    venda.setTroco(BigDecimal.ZERO);
                }

                venda.setStatus("CONCLUIDA");
                vendaRepository.save(venda);
            }
        }
    }
}
