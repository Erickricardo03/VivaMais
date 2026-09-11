import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { ProdutoService } from '../../core/services/produto.service';
import { DashboardResumo, FaturamentoPeriodo, AlertaProduto, PontoGrafico } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <!-- Cabeçalho de Boas-Vindas -->
      <div class="dashboard-header">
        <div>
          <h1 class="page-title">Painel de Inteligência & Faturamento</h1>
          <p class="page-subtitle">Acompanhe métricas financeiras, alertas de validade e giro de estoque da VivaMais em tempo real.</p>
        </div>
        <div class="header-actions">
          <button (click)="recarregarTudo()" class="btn-secondary btn-refresh" [class.spinning]="carregando">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span>Atualizar Dados</span>
          </button>
          <a routerLink="/pdv" class="btn-primary">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Abrir Caixa (PDV)</span>
          </a>
        </div>
      </div>

      <!-- Alertas Rápidos no Topo se houver itens críticos -->
      <div *ngIf="alertasCriticos.length > 0" class="alerts-banner animate-fade-in">
        <div class="alert-icon-box">
          <svg class="icon-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div class="alert-text-box">
          <strong>Atenção ao Estoque e Validades:</strong>
          <span>
            Existem <strong>{{ resumo?.produtosEstoqueBaixoCount || 0 }} produtos</strong> com estoque baixo,
            <strong>{{ resumo?.produtosVencendoCount || 0 }} produtos</strong> próximos do vencimento e
            <strong>{{ resumo?.produtosVencidosCount || 0 }} produtos</strong> vencidos.
          </span>
        </div>
        <a routerLink="/estoque" class="btn-alert-action">Resolver Alertas no Estoque →</a>
      </div>

      <!-- 4 Cards Principais de Faturamento (Diário, Semanal, Mensal, Anual) -->
      <!-- Clicáveis: cada card sincroniza a seção "Análise de Faturamento" abaixo com o período correspondente -->
      <div class="kpi-grid">
        <!-- Faturamento Hoje -->
        <button
          type="button"
          class="kpi-card kpi-hoje"
          [class.kpi-active]="periodoSelecionado === 'DIARIO'"
          (click)="selecionarPeriodo('DIARIO', true)"
          title="Ver detalhamento diário na análise abaixo">
          <div class="kpi-header">
            <span class="kpi-badge badge-hoje">Hoje</span>
            <div class="kpi-icon-wrapper icon-green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="kpi-label">Faturamento Diário</div>
          <div class="kpi-value">{{ (resumo?.faturamentoHoje || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
          <div class="kpi-meta">
            <span><strong>{{ resumo?.vendasHoje || 0 }}</strong> vendas</span>
            <span>•</span>
            <span>Ticket médio: <strong>{{ (resumo?.ticketMedioHoje || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong></span>
          </div>
          <div class="kpi-click-hint">Ver detalhes →</div>
        </button>

        <!-- Faturamento Semanal -->
        <button
          type="button"
          class="kpi-card kpi-semana"
          [class.kpi-active]="periodoSelecionado === 'SEMANAL'"
          (click)="selecionarPeriodo('SEMANAL', true)"
          title="Ver detalhamento semanal na análise abaixo">
          <div class="kpi-header">
            <span class="kpi-badge badge-semana">Últimos 7 dias</span>
            <div class="kpi-icon-wrapper icon-amber">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
          <div class="kpi-label">Faturamento Semanal</div>
          <div class="kpi-value">{{ (resumo?.faturamentoSemana || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
          <div class="kpi-meta">
            <span><strong>{{ resumo?.vendasSemana || 0 }}</strong> vendas na semana</span>
          </div>
          <div class="kpi-click-hint">Ver detalhes →</div>
        </button>

        <!-- Faturamento Mensal -->
        <button
          type="button"
          class="kpi-card kpi-mes"
          [class.kpi-active]="periodoSelecionado === 'MENSAL'"
          (click)="selecionarPeriodo('MENSAL', true)"
          title="Ver detalhamento mensal na análise abaixo">
          <div class="kpi-header">
            <span class="kpi-badge badge-mes">Mês Atual</span>
            <div class="kpi-icon-wrapper icon-emerald">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
          </div>
          <div class="kpi-label">Faturamento Mensal</div>
          <div class="kpi-value">{{ (resumo?.faturamentoMes || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
          <div class="kpi-meta">
            <span><strong>{{ resumo?.vendasMes || 0 }}</strong> vendas no mês</span>
            <span>•</span>
            <span>Ticket: <strong>{{ (resumo?.ticketMedioMes || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong></span>
          </div>
          <div class="kpi-click-hint">Ver detalhes →</div>
        </button>

        <!-- Faturamento Anual -->
        <button
          type="button"
          class="kpi-card kpi-ano"
          [class.kpi-active]="periodoSelecionado === 'ANUAL'"
          (click)="selecionarPeriodo('ANUAL', true)"
          title="Ver detalhamento anual na análise abaixo">
          <div class="kpi-header">
            <span class="kpi-badge badge-ano">Ano Vigente</span>
            <div class="kpi-icon-wrapper icon-gold">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
          </div>
          <div class="kpi-label">Faturamento Anual</div>
          <div class="kpi-value">{{ (resumo?.faturamentoAno || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
          <div class="kpi-meta">
            <span><strong>{{ resumo?.vendasAno || 0 }}</strong> vendas acumuladas</span>
          </div>
          <div class="kpi-click-hint">Ver detalhes →</div>
        </button>
      </div>

      <!-- Seção com Filtro de Faturamento & Gráfico Interativo -->
      <div class="section-card card" id="analise-faturamento">
        <div class="card-header-flex">
          <div>
            <h2 class="section-title">Análise de Faturamento com Filtros Dinâmicos</h2>
            <p class="section-subtitle">Selecione o período desejado para filtrar o faturamento, lucro e gráfico temporal.</p>
          </div>

          <!-- Filtros de Período Solicitados pelo Usuário -->
          <div class="filter-toolbar">
            <button
              [class.active]="periodoSelecionado === 'DIARIO'"
              (click)="selecionarPeriodo('DIARIO')"
              class="filter-btn">
              Hoje (Diário)
            </button>
            <button
              [class.active]="periodoSelecionado === 'SEMANAL'"
              (click)="selecionarPeriodo('SEMANAL')"
              class="filter-btn">
              Semanal (7 Dias)
            </button>
            <button
              [class.active]="periodoSelecionado === 'MENSAL'"
              (click)="selecionarPeriodo('MENSAL')"
              class="filter-btn">
              Mensal
            </button>
            <button
              [class.active]="periodoSelecionado === 'ANUAL'"
              (click)="selecionarPeriodo('ANUAL')"
              class="filter-btn">
              Anual
            </button>
            <button
              [class.active]="periodoSelecionado === 'CUSTOM'"
              (click)="selecionarPeriodo('CUSTOM')"
              class="filter-btn">
              Personalizado
            </button>
          </div>
        </div>

        <!-- Seção de datas customizadas caso CUSTOM esteja ativo -->
        <div *ngIf="periodoSelecionado === 'CUSTOM'" class="custom-dates-bar animate-fade-in">
          <div class="date-field">
            <label>Data Inicial:</label>
            <input type="date" [(ngModel)]="dataInicioCustom" />
          </div>
          <div class="date-field">
            <label>Data Final:</label>
            <input type="date" [(ngModel)]="dataFimCustom" />
          </div>
          <button (click)="aplicarFiltroCustom()" class="btn-primary btn-apply">Filtrar Período</button>
        </div>

        <!-- Resumo do Período Filtrado -->
        <div class="period-stats-strip">
          <div class="period-stat">
            <span class="stat-label">Faturamento no Período</span>
            <span class="stat-val text-green">{{ (faturamentoDados?.faturamentoTotal || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>
          <div class="period-divider"></div>
          <div class="period-stat">
            <span class="stat-label">Custo das Mercadorias (CMV)</span>
            <span class="stat-val text-muted">{{ (faturamentoDados?.custoTotal || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>
          <div class="period-divider"></div>
          <div class="period-stat">
            <span class="stat-label">Lucro Bruto Estimado</span>
            <span class="stat-val text-gold">{{ (faturamentoDados?.lucroEstimado || 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
          </div>
          <div class="period-divider"></div>
          <div class="period-stat">
            <span class="stat-label">Margem de Lucro</span>
            <span class="stat-val text-primary">{{ (faturamentoDados?.margemLucroPercentual || 0) }}%</span>
          </div>
          <div class="period-divider"></div>
          <div class="period-stat">
            <span class="stat-label">Volume de Vendas</span>
            <span class="stat-val">{{ faturamentoDados?.quantidadeVendas || 0 }} transações</span>
          </div>
        </div>

        <!-- Gráfico Visual de Barras com Escala Automática -->
        <div class="chart-wrapper">
          <div class="chart-header">
            <span class="chart-caption">Evolução do Faturamento ({{ getDescricaoPeriodo() }})</span>
            <span class="chart-unit">Valores em Reais (R$)</span>
          </div>

          <div class="bar-chart-container" *ngIf="faturamentoDados?.pontosGrafico?.length">
            <div class="chart-bars">
              <div
                *ngFor="let ponto of faturamentoDados?.pontosGrafico"
                class="bar-column"
                [title]="ponto.label + ': ' + (ponto.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR') + ' (' + ponto.quantidadeVendas + ' vendas)'">
                <div class="bar-fill-wrapper">
                  <div
                    class="bar-fill"
                    [style.height.%]="calcularAlturaBarra(ponto.valor)">
                    <span class="bar-tooltip">{{ ponto.valor | currency:'BRL':'symbol':'1.0-0':'pt-BR' }}</span>
                  </div>
                </div>
                <div class="bar-label">{{ ponto.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grade com Alertas de Estoque & Produtos Mais Vendidos -->
      <div class="bottom-grid">
        <!-- Alertas Imediatos de Vencimento e Estoque Baixo -->
        <div class="card alerts-card">
          <div class="card-title">
            <div class="title-with-icon">
              <svg class="title-icon icon-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>Alertas Críticos de Estoque & Validade</span>
            </div>
            <a routerLink="/estoque" class="link-more">Ver Todos ({{ alertasCriticos.length }}) →</a>
          </div>

          <div *ngIf="alertasCriticos.length === 0" class="empty-state">
            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <p>Tudo sob controle! Nenhum produto com estoque crítico ou data de validade próxima no momento.</p>
          </div>

          <div *ngIf="alertasCriticos.length > 0" class="alerts-list">
            <div *ngFor="let item of alertasCriticos.slice(0, 6)" class="alert-item">
              <div class="alert-item-info">
                <div class="alert-item-nome">{{ item.nome }}</div>
                <div class="alert-item-category">{{ item.categoria }} • Lote: {{ item.lote || 'N/A' }}</div>
              </div>
              <div class="alert-item-badges">
                <!-- Badge de Estoque Baixo -->
                <span *ngIf="item.estoqueBaixo" class="badge badge-warning">
                  Estoque: {{ item.estoqueAtual }} {{ item.unidade }} (Mín: {{ item.estoqueMinimo }})
                </span>

                <!-- Badge de Validade -->
                <span *ngIf="item.statusValidade === 'VENCIDO'" class="badge badge-danger">
                  Vencido há {{ (item.diasParaVencer || 0) * -1 }} dias
                </span>
                <span *ngIf="item.statusValidade === 'CRITICO'" class="badge badge-danger">
                  Vence em {{ item.diasParaVencer }} dias
                </span>
                <span *ngIf="item.statusValidade === 'ALERTA'" class="badge badge-warning">
                  Vence em {{ item.diasParaVencer }} dias
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ranking dos Produtos Mais Vendidos no Período -->
        <div class="card ranking-card">
          <div class="card-title">
            <div class="title-with-icon">
              <svg class="title-icon icon-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
              <span>Mais Vendidos ({{ getDescricaoPeriodo() }})</span>
            </div>
            <a routerLink="/relatorios" class="link-more">Ver Relatório Completo →</a>
          </div>

          <div *ngIf="!faturamentoDados?.rankingProdutos?.length" class="empty-state">
            <p>Nenhuma venda registrada no período selecionado.</p>
          </div>

          <div *ngIf="faturamentoDados?.rankingProdutos?.length" class="ranking-list">
            <div *ngFor="let prod of faturamentoDados?.rankingProdutos; let idx = index" class="ranking-item">
              <div class="ranking-pos">{{ idx + 1 }}º</div>
              <div class="ranking-info">
                <div class="ranking-nome">{{ prod.nome }}</div>
                <div class="ranking-qtd">{{ prod.quantidade }} unidades vendidas</div>
              </div>
              <div class="ranking-total">{{ prod.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .dashboard-header {
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-refresh.spinning svg {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .icon {
      width: 18px;
      height: 18px;
    }

    /* Banner de Alertas Rápidos */
    .alerts-banner {
      background: #fffbeb;
      border: 1.5px solid #fde68a;
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-sm);
    }

    .alert-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #fef3c7;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d97706;
      flex-shrink: 0;
    }

    .icon-warning {
      width: 24px;
      height: 24px;
    }

    .alert-text-box {
      flex: 1;
      font-size: 0.92rem;
      color: #92400e;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .btn-alert-action {
      background: #d97706;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.2s;
    }

    .btn-alert-action:hover {
      background: #b45309;
    }

    /* KPI Grid Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .kpi-card {
      width: 100%;
      background: #ffffff;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      padding: 22px;
      box-shadow: var(--shadow-sm);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: stretch;
      text-align: left;
      font-family: inherit;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
      cursor: pointer;
      outline: none;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .kpi-card:focus-visible {
      box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.3);
    }

    .kpi-card.kpi-active {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.18), var(--shadow-md);
    }

    .kpi-click-hint {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary);
      margin-top: 10px;
      opacity: 0;
      transform: translateX(-4px);
      transition: opacity 0.2s, transform 0.2s;
    }

    .kpi-card:hover .kpi-click-hint,
    .kpi-card.kpi-active .kpi-click-hint {
      opacity: 1;
      transform: translateX(0);
    }

    .kpi-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .kpi-badge {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-hoje { background: #dcfce7; color: #15803d; }
    .badge-semana { background: #fef3c7; color: #b45309; }
    .badge-mes { background: #e0f2fe; color: #0369a1; }
    .badge-ano { background: #fae8ff; color: #86198f; }

    .kpi-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kpi-icon-wrapper svg {
      width: 22px;
      height: 22px;
    }

    .icon-green { background: #f0fdf4; color: #16a34a; }
    .icon-amber { background: #fffbeb; color: #d97706; }
    .icon-emerald { background: #ecfdf5; color: #059669; }
    .icon-gold { background: #fefce8; color: #ca8a04; }

    .kpi-label {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .kpi-value {
      font-size: 1.95rem;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.5px;
      margin: 4px 0 8px;
    }

    .kpi-meta {
      font-size: 0.82rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Seção de Filtro e Gráfico */
    .section-card {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .card-header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .section-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .section-subtitle {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .filter-toolbar {
      display: flex;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 4px;
      gap: 4px;
    }

    .filter-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      transition: all 0.2s;
    }

    .filter-btn:hover {
      color: var(--primary);
    }

    .filter-btn.active {
      background: #ffffff;
      color: var(--primary);
      font-weight: 700;
      box-shadow: var(--shadow-sm);
    }

    .custom-dates-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #f8fafc;
      padding: 14px 18px;
      border-radius: var(--radius-sm);
      border: 1px dashed var(--border);
      flex-wrap: wrap;
    }

    .date-field {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.88rem;
      font-weight: 600;
    }

    .date-field input {
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.85rem;
      background: #ffffff;
    }

    .btn-apply {
      padding: 8px 16px;
      font-size: 0.85rem;
    }

    /* Faixa de Métricas do Período */
    .period-stats-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fdfdfd;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 18px 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .period-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .period-divider {
      width: 1px;
      height: 38px;
      background: var(--border);
    }

    .stat-label {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }

    .stat-val {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .text-green { color: var(--primary); }
    .text-gold { color: #d97706; }

    /* Gráfico de Barras Responsivo */
    .chart-wrapper {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 20px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 20px;
      font-weight: 600;
    }

    .bar-chart-container {
      width: 100%;
      max-width: 100%;
      height: 220px;
      position: relative;
      /* Com muitas barras (ex: 30 dias do mês) não sobra espaço para todas
         encolherem à vontade — em vez de estourar a borda do card, o
         gráfico ganha rolagem horizontal própria e contida. */
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .chart-bars {
      display: flex;
      align-items: flex-end;
      height: 100%;
      min-height: 100%;
      width: max-content;
      min-width: 100%;
      gap: 12px;
      border-bottom: 2px solid var(--border);
      padding-bottom: 8px;
      box-sizing: border-box;
    }

    .bar-column {
      flex: 1 0 40px;
      min-width: 40px;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      cursor: pointer;
    }

    .bar-fill-wrapper {
      width: 100%;
      height: calc(100% - 24px);
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .bar-fill {
      width: 70%;
      max-width: 44px;
      min-height: 6px;
      background: linear-gradient(180deg, #22c55e 0%, #15803d 100%);
      border-radius: 6px 6px 0 0;
      position: relative;
      transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s;
    }

    .bar-column:hover .bar-fill {
      background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
    }

    .bar-tooltip {
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      opacity: 0.9;
    }

    .bar-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 8px;
      white-space: nowrap;
    }

    /* Bottom Grid: Alertas e Ranking */
    .bottom-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .title-with-icon {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-icon {
      width: 22px;
      height: 22px;
    }

    .icon-danger { color: #ef4444; }

    .link-more {
      font-size: 0.85rem;
      color: var(--primary);
      text-decoration: none;
      font-weight: 700;
    }

    .link-more:hover {
      text-decoration: underline;
    }

    .alerts-list, .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      gap: 12px;
    }

    .alert-item-nome {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-main);
    }

    .alert-item-category {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .alert-item-badges {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .ranking-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      background: #fdfdfd;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }

    .ranking-pos {
      font-size: 1rem;
      font-weight: 800;
      color: var(--primary);
      width: 24px;
    }

    .ranking-info {
      flex: 1;
    }

    .ranking-nome {
      font-weight: 700;
      font-size: 0.9rem;
    }

    .ranking-qtd {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .ranking-total {
      font-weight: 800;
      font-size: 0.95rem;
      color: var(--text-main);
    }

    .empty-state {
      text-align: center;
      padding: 32px 16px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .empty-icon {
      width: 36px;
      height: 36px;
      color: var(--primary);
      margin-bottom: 8px;
    }

    /* Responsivo: tablets */
    @media (max-width: 1024px) {
      .bottom-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Responsivo: tablets e celulares */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 20px 16px;
        gap: 20px;
      }

      .page-title {
        font-size: 1.4rem;
      }

      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions .btn-secondary,
      .header-actions .btn-primary {
        flex: 1;
        justify-content: center;
      }

      .kpi-grid {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .kpi-card {
        padding: 16px;
      }

      .kpi-value {
        font-size: 1.4rem;
      }

      .card-header-flex {
        flex-direction: column;
        align-items: flex-start;
      }

      .filter-toolbar {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .filter-btn {
        white-space: nowrap;
      }

      .period-stats-strip {
        padding: 14px 16px;
      }

      .period-divider {
        display: none;
      }

      /* Em telas pequenas as barras ficam um pouco mais estreitas, mas nunca
         a ponto de virarem ilegíveis — o scroll (já ativo por padrão) cuida do resto. */
      .chart-bars {
        padding: 0 4px;
      }

      .bar-column {
        flex-basis: 34px;
        min-width: 34px;
      }
    }

    @media (max-width: 480px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  dashboardService = inject(DashboardService);
  produtoService = inject(ProdutoService);
  private cdr = inject(ChangeDetectorRef);

  resumo: DashboardResumo | null = null;
  faturamentoDados: FaturamentoPeriodo | null = null;
  alertasCriticos: AlertaProduto[] = [];

  periodoSelecionado = 'MENSAL';
  dataInicioCustom = '';
  dataFimCustom = '';
  carregando = false;

  private faturamentoSub?: Subscription;

  ngOnInit(): void {
    this.recarregarTudo();
  }

  recarregarTudo(): void {
    this.carregando = true;
    this.carregarResumo();
    this.carregarFaturamento(this.periodoSelecionado);
    this.carregarAlertas();
  }

  carregarResumo(): void {
    this.dashboardService.getResumo().subscribe({
      next: (res) => {
        this.resumo = res;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  carregarFaturamento(periodo: string, inicio?: string, fim?: string): void {
    // Cancela qualquer requisição anterior ainda em andamento: sem isso, ao clicar
    // rapidamente em dois períodos diferentes, a resposta mais antiga podia chegar
    // por último e sobrescrever os dados do período mais recente clicado (por isso
    // parecia que era preciso clicar duas vezes para atualizar).
    this.faturamentoSub?.unsubscribe();
    this.carregando = true;
    this.faturamentoSub = this.dashboardService.getFaturamento(periodo, inicio, fim).subscribe({
      next: (res) => {
        this.faturamentoDados = res;
        this.carregando = false;
        // Força a atualização da tela imediatamente ao receber a resposta, em vez
        // de esperar o próximo evento (clique, digitação etc.) disparar o Angular.
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  carregarAlertas(): void {
    this.produtoService.getAlertasTodos().subscribe({
      next: (res) => {
        this.alertasCriticos = res;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  selecionarPeriodo(periodo: string, rolarParaAnalise = false): void {
    this.periodoSelecionado = periodo;
    if (periodo !== 'CUSTOM') {
      this.carregarFaturamento(periodo);
    }
    if (rolarParaAnalise && typeof document !== 'undefined') {
      document.getElementById('analise-faturamento')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  aplicarFiltroCustom(): void {
    if (this.dataInicioCustom && this.dataFimCustom) {
      this.carregarFaturamento('CUSTOM', this.dataInicioCustom, this.dataFimCustom);
    }
  }

  calcularAlturaBarra(valor: number): number {
    if (!this.faturamentoDados?.pontosGrafico?.length) return 5;
    const max = Math.max(...this.faturamentoDados.pontosGrafico.map(p => p.valor), 1);
    const pct = (valor / max) * 100;
    return Math.max(pct, 4); // Altura mínima visível
  }

  getDescricaoPeriodo(): string {
    switch (this.periodoSelecionado) {
      case 'DIARIO': return 'Vendas por faixa de horário hoje';
      case 'SEMANAL': return 'Últimos 7 dias';
      case 'ANUAL': return 'Mês a mês no ano atual';
      case 'CUSTOM': return 'Período customizado';
      case 'MENSAL':
      default: return 'Dia a dia no mês atual';
    }
  }
}
