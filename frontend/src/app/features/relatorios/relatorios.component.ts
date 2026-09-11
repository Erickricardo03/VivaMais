import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { VendaService } from '../../core/services/venda.service';
import { FaturamentoPeriodo, VendaResponse } from '../../core/models/models';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relatorios-container">
      <!-- Cabeçalho -->
      <div class="relatorios-header">
        <div>
          <h1 class="page-title">Relatórios de Faturamento & Inteligência Financeira</h1>
          <p class="page-subtitle">Consulte o histórico financeiro com filtros por dia, semana, mês, ano ou intervalo personalizado.</p>
        </div>
        <div class="header-actions">
          <button (click)="imprimirRelatorio()" class="btn-secondary">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      <!-- Barra de Filtros de Período -->
      <div class="card filter-card">
        <div class="filter-top-row">
          <span class="filter-label">Selecione o Período de Faturamento:</span>
          <div class="filter-tabs">
            <button
              [class.active]="periodo === 'DIARIO'"
              (click)="selecionarPeriodo('DIARIO')"
              class="tab-btn">
              Diário (Hoje)
            </button>
            <button
              [class.active]="periodo === 'SEMANAL'"
              (click)="selecionarPeriodo('SEMANAL')"
              class="tab-btn">
              Semanal (7 Dias)
            </button>
            <button
              [class.active]="periodo === 'MENSAL'"
              (click)="selecionarPeriodo('MENSAL')"
              class="tab-btn">
              Mensal (Mês Atual)
            </button>
            <button
              [class.active]="periodo === 'ANUAL'"
              (click)="selecionarPeriodo('ANUAL')"
              class="tab-btn">
              Anual (Ano Vigente)
            </button>
            <button
              [class.active]="periodo === 'CUSTOM'"
              (click)="selecionarPeriodo('CUSTOM')"
              class="tab-btn">
              Personalizado
            </button>
          </div>
        </div>

        <!-- Seção de Intervalo de Datas para CUSTOM -->
        <div *ngIf="periodo === 'CUSTOM'" class="custom-range-row animate-fade-in">
          <div class="input-date-group">
            <label>Data Início:</label>
            <input type="date" [(ngModel)]="dataInicio" />
          </div>
          <div class="input-date-group">
            <label>Data Fim:</label>
            <input type="date" [(ngModel)]="dataFim" />
          </div>
          <button (click)="aplicarFiltro()" class="btn-primary">Filtrar</button>
        </div>
      </div>

      <!-- Métricas Consolidadas do Período -->
      <div class="finance-kpis">
        <div class="kpi-card-box kpi-fat">
          <span class="kpi-title">FATURAMENTO BRUTO</span>
          <div class="kpi-main-val text-green">{{ (dados?.faturamentoTotal || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
          <div class="kpi-sub">{{ dados?.quantidadeVendas || 0 }} transações no período</div>
        </div>

        <div class="kpi-card-box kpi-cost">
          <span class="kpi-title">CUSTO TOTAL (CMV)</span>
          <div class="kpi-main-val text-muted">{{ (dados?.custoTotal || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
          <div class="kpi-sub">Custo de aquisição das mercadorias</div>
        </div>

        <div class="kpi-card-box kpi-profit">
          <span class="kpi-title">LUCRO ESTIMADO</span>
          <div class="kpi-main-val text-gold">{{ (dados?.lucroEstimado || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
          <div class="kpi-sub">Margem média: <strong>{{ dados?.margemLucroPercentual || 0 }}%</strong></div>
        </div>

        <div class="kpi-card-box kpi-ticket">
          <span class="kpi-title">TICKET MÉDIO</span>
          <div class="kpi-main-val text-primary">{{ (dados?.ticketMedio || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
          <div class="kpi-sub">Gasto médio por cliente</div>
        </div>
      </div>

      <!-- Tabela com Histórico de Vendas do Período -->
      <div class="card history-card">
        <div class="card-title">
          <span>Transações Realizadas no Período</span>
          <span class="badge badge-info">{{ dados?.vendas?.length || 0 }} vendas listadas</span>
        </div>

        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Código da Venda</th>
                <th>Data / Hora</th>
                <th>Forma de Pagamento</th>
                <th>Itens Vendidos</th>
                <th>Subtotal / Desconto</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th style="text-align: right;">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="!dados?.vendas?.length">
                <td colspan="8" class="empty-row">Nenhuma venda encontrada no período.</td>
              </tr>

              <tr *ngFor="let v of dados?.vendas">
                <td>
                  <strong>{{ v.numeroVenda }}</strong>
                </td>
                <td>
                  {{ formatarDataHora(v.dataHora) }}
                </td>
                <td>
                  <span class="payment-badge" [class.badge-pix]="v.formaPagamento === 'PIX'" [class.badge-dinheiro]="v.formaPagamento === 'DINHEIRO'">
                    {{ formatarPagamento(v.formaPagamento) }}
                  </span>
                </td>
                <td>
                  <div class="items-summary">
                    <span *ngFor="let it of v.itens.slice(0, 2)" class="item-tag">
                      {{ it.quantidade }}x {{ it.nomeProduto }}
                    </span>
                    <span *ngIf="v.itens.length > 2" class="more-items-tag">
                      +{{ v.itens.length - 2 }} itens
                    </span>
                  </div>
                </td>
                <td>
                  <div>{{ v.subtotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
                  <div *ngIf="v.desconto > 0" class="text-danger" style="font-size: 0.75rem;">
                    -{{ v.desconto | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </div>
                </td>
                <td>
                  <strong class="text-green" style="font-size: 1.05rem;">
                    {{ v.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </strong>
                </td>
                <td>
                  <span class="badge" [class.badge-success]="v.status === 'CONCLUIDA'" [class.badge-danger]="v.status === 'CANCELADA'">
                    {{ v.status }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button
                    *ngIf="v.status === 'CONCLUIDA'"
                    (click)="cancelarVenda(v)"
                    class="btn-cancel-sale"
                    title="Cancelar e Estornar Estoque">
                    Estornar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .relatorios-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .relatorios-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.5px;
    }

    .page-subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 4px;
    }

    .icon {
      width: 18px;
      height: 18px;
    }

    /* Card de Filtros */
    .filter-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px 24px;
    }

    .filter-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .filter-label {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .filter-tabs {
      display: flex;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 4px;
      gap: 4px;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: var(--primary);
    }

    .tab-btn.active {
      background: #ffffff;
      color: var(--primary);
      font-weight: 700;
      box-shadow: var(--shadow-sm);
    }

    .custom-range-row {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #f8fafc;
      padding: 14px 18px;
      border-radius: var(--radius-sm);
      border: 1px dashed var(--border);
      flex-wrap: wrap;
    }

    .input-date-group {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.88rem;
      font-weight: 600;
    }

    .input-date-group input {
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.85rem;
      background: #ffffff;
    }

    /* KPIs Financeiros */
    .finance-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .kpi-card-box {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 22px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .kpi-title {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }

    .kpi-main-val {
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .kpi-sub {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .text-green { color: var(--primary); }
    .text-gold { color: #d97706; }
    .text-primary { color: #15803d; }

    /* Tabela */
    .history-card {
      padding: 0;
      overflow: hidden;
    }

    .history-card .card-title {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 0;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .payment-badge {
      font-size: 0.78rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      background: #f1f5f9;
      color: var(--text-main);
    }

    .badge-pix {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .badge-dinheiro {
      background: #fefce8;
      color: #854d0e;
      border: 1px solid #fef08a;
    }

    .items-summary {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-tag {
      font-size: 0.8rem;
      color: var(--text-main);
    }

    .more-items-tag {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .btn-cancel-sale {
      background: #fef2f2;
      color: #ef4444;
      border: 1px solid #fecaca;
      padding: 5px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .btn-cancel-sale:hover {
      background: #fee2e2;
    }

    .empty-row {
      text-align: center;
      padding: 36px;
      color: var(--text-muted);
    }

    /* Responsivo: tablets e celulares */
    @media (max-width: 768px) {
      .relatorios-container {
        padding: 20px 16px;
        gap: 18px;
      }

      .page-title {
        font-size: 1.4rem;
      }

      .relatorios-header .btn-secondary {
        width: 100%;
        justify-content: center;
      }

      .filter-card {
        padding: 16px;
      }
    }

    @media (max-width: 480px) {
      .finance-kpis {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class RelatoriosComponent implements OnInit {
  dashboardService = inject(DashboardService);
  vendaService = inject(VendaService);
  private cdr = inject(ChangeDetectorRef);

  periodo = 'MENSAL';
  dataInicio = '';
  dataFim = '';
  dados: FaturamentoPeriodo | null = null;

  private dadosSub?: Subscription;

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    // Cancela qualquer requisição anterior ainda em andamento e força a tela a
    // repintar assim que a resposta chega, em vez de esperar outro evento.
    this.dadosSub?.unsubscribe();
    this.dadosSub = this.dashboardService.getFaturamento(this.periodo, this.dataInicio, this.dataFim).subscribe({
      next: (res) => {
        this.dados = res;
        this.cdr.detectChanges();
      }
    });
  }

  selecionarPeriodo(p: string): void {
    this.periodo = p;
    if (p !== 'CUSTOM') {
      this.carregarDados();
    }
  }

  aplicarFiltro(): void {
    if (this.dataInicio && this.dataFim) {
      this.carregarDados();
    }
  }

  formatarDataHora(dh?: string): string {
    if (!dh) return '';
    const d = new Date(dh);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatarPagamento(fp: string): string {
    switch (fp) {
      case 'PIX': return '⚡ PIX';
      case 'CARTAO_CREDITO': return '💳 Cartão Crédito';
      case 'CARTAO_DEBITO': return '💳 Cartão Débito';
      case 'DINHEIRO': return '💵 Dinheiro';
      default: return fp;
    }
  }

  cancelarVenda(v: VendaResponse): void {
    if (confirm(`Deseja realmente cancelar a venda ${v.numeroVenda}? Os itens serão estornados de volta para o estoque.`)) {
      this.vendaService.cancelarVenda(v.id).subscribe({
        next: () => {
          this.carregarDados();
        }
      });
    }
  }

  imprimirRelatorio(): void {
    window.print();
  }
}
