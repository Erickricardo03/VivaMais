export interface Produto {
  id?: number;
  nome: string;
  codigoBarras: string;
  categoria: string;
  descricao?: string;
  unidade: string;
  precoCusto: number;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  dataValidade?: string;
  lote?: string;
  ativo?: boolean;
  estoqueBaixo?: boolean;
  vencido?: boolean;
  venceEmBreve?: boolean;
  diasParaVencer?: number;
  statusValidade?: 'VENCIDO' | 'CRITICO' | 'ALERTA' | 'REGULAR' | 'SEM_VALIDADE';
}

export interface AlertaProduto {
  id: number;
  nome: string;
  categoria: string;
  unidade: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  precoVenda: number;
  dataValidade?: string;
  lote?: string;
  diasParaVencer?: number;
  statusValidade: 'VENCIDO' | 'CRITICO' | 'ALERTA' | 'REGULAR' | 'SEM_VALIDADE';
  estoqueBaixo: boolean;
  nivelUrgencia: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export interface ItemVenda {
  produtoId: number;
  nomeProduto?: string;
  quantidade: number;
  precoUnitario: number;
  subtotal?: number;
}

export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO';

export interface VendaRequest {
  itens: ItemVenda[];
  formaPagamento: FormaPagamento;
  desconto?: number;
  valorRecebido?: number;
  clienteId?: number;
}

export interface VendaResponse {
  id: number;
  numeroVenda: string;
  dataHora: string;
  subtotal: number;
  desconto: number;
  valorTotal: number;
  formaPagamento: FormaPagamento;
  valorRecebido: number;
  troco: number;
  status: string;
  itens: ItemVenda[];
  clienteId?: number;
  clienteNome?: string;
}

export interface DashboardResumo {
  faturamentoHoje: number;
  vendasHoje: number;
  faturamentoSemana: number;
  vendasSemana: number;
  faturamentoMes: number;
  vendasMes: number;
  faturamentoAno: number;
  vendasAno: number;
  ticketMedioHoje: number;
  ticketMedioMes: number;
  totalProdutosCadastrados: number;
  produtosEstoqueBaixoCount: number;
  produtosVencendoCount: number;
  produtosVencidosCount: number;
}

export interface PontoGrafico {
  label: string;
  dataCompleta: string;
  valor: number;
  quantidadeVendas: number;
}

export interface RankingProduto {
  nome: string;
  quantidade: number;
  valorTotal: number;
}

export interface FaturamentoPeriodo {
  periodo: 'DIARIO' | 'SEMANAL' | 'MENSAL' | 'ANUAL' | 'CUSTOM';
  dataInicio: string;
  dataFim: string;
  faturamentoTotal: number;
  custoTotal: number;
  lucroEstimado: number;
  margemLucroPercentual: number;
  quantidadeVendas: number;
  ticketMedio: number;
  pontosGrafico: PontoGrafico[];
  rankingProdutos: RankingProduto[];
  vendas: VendaResponse[];
}

export interface LoginResponse {
  authenticated: boolean;
  token?: string;
  username?: string;
  nome?: string;
  cargo?: string;
  message?: string;
}

export interface AjusteEstoque {
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantidade: number;
  motivo?: string;
}

export type CategoriaDespesa = 'FORNECEDOR' | 'MANUTENCAO' | 'LIMPEZA' | 'ALIMENTACAO' | 'TRANSPORTE' | 'SANGRIA' | 'OUTROS';

export interface DespesaCaixa {
  id: number;
  descricao: string;
  categoria: CategoriaDespesa;
  valor: number;
  dataHora: string;
}

export interface Caixa {
  id: number;
  operador: string;
  dataAbertura: string;
  valorAbertura: number;
  dataFechamento?: string;
  status: 'ABERTO' | 'FECHADO';
  despesas: DespesaCaixa[];
  vendasDinheiro: number;
  vendasPix: number;
  vendasCartaoCredito: number;
  vendasCartaoDebito: number;
  quantidadeVendas: number;
  valorContadoFechamento?: number;
  saldoEsperadoFechamento?: number;
  diferencaFechamento?: number;
  observacoesFechamento?: string;
  // Calculados pelo backend (Caixa#getTotalDespesas / #getSaldoEsperadoDinheiro)
  totalDespesas: number;
  saldoEsperadoDinheiro: number;
}

export interface Cliente {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  dataCadastro: string;
  ultimaCompra?: string;
  totalCompras: number;
  valorTotalGasto: number;
}
