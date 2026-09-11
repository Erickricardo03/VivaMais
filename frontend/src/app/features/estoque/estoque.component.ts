import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProdutoService } from '../../core/services/produto.service';
import { Produto, AjusteEstoque } from '../../core/models/models';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="estoque-container">
      <!-- Cabeçalho -->
      <div class="estoque-header">
        <div>
          <h1 class="page-title">Controle de Estoque & Alertas de Produtos</h1>
          <p class="page-subtitle">Gerenciamento de quantidades, monitoramento de prazos de validade e reposição de estoque.</p>
        </div>
        <div class="header-actions">
          <button (click)="abrirModalNovo()" class="btn-primary">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      <!-- Cards de Resumo dos Alertas de Estoque e Validade -->
      <div class="alert-kpi-grid">
        <div class="alert-kpi-card" (click)="selecionarAba('todos')" [class.active-tab]="filtroAba === 'todos'">
          <div class="kpi-num text-primary">{{ produtos.length }}</div>
          <div class="kpi-desc">Total de Produtos</div>
        </div>

        <div class="alert-kpi-card card-warning" (click)="selecionarAba('estoque_baixo')" [class.active-tab]="filtroAba === 'estoque_baixo'">
          <div class="kpi-num text-warning">{{ totalEstoqueBaixo }}</div>
          <div class="kpi-desc">⚠️ Estoque Baixo (Repor)</div>
        </div>

        <div class="alert-kpi-card card-alert" (click)="selecionarAba('validade_proxima')" [class.active-tab]="filtroAba === 'validade_proxima'">
          <div class="kpi-num text-orange">{{ totalValidadeProxima }}</div>
          <div class="kpi-desc">⏰ Vencendo em 30 Dias</div>
        </div>

        <div class="alert-kpi-card card-danger" (click)="selecionarAba('vencidos')" [class.active-tab]="filtroAba === 'vencidos'">
          <div class="kpi-num text-danger">{{ totalVencidos }}</div>
          <div class="kpi-desc">❌ Produtos Vencidos</div>
        </div>
      </div>

      <!-- Barra de Filtros e Busca -->
      <div class="card toolbar-card">
        <div class="search-box">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            [(ngModel)]="termoBusca"
            (ngModelChange)="filtrar()"
            placeholder="Buscar por nome do produto, código de barras ou lote..."
          />
          <button *ngIf="termoBusca" (click)="termoBusca = ''; filtrar()" class="btn-clear-search">✕</button>
        </div>

        <div class="category-filter">
          <select [(ngModel)]="categoriaSelecionada" (change)="filtrar()">
            <option value="">Todas as Categorias</option>
            <option *ngFor="let cat of categorias" [value]="cat">{{ cat }}</option>
          </select>
        </div>
      </div>

      <!-- Tabela de Produtos -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Produto & Detalhes</th>
                <th>Código / EAN</th>
                <th>Preços (Custo / Venda)</th>
                <th>Quantidade em Estoque</th>
                <th>Data de Validade</th>
                <th style="text-align: right;">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="produtosFiltrados.length === 0">
                <td colspan="6" class="empty-table-row">
                  Nenhum produto encontrado com os filtros selecionados.
                </td>
              </tr>

              <tr *ngFor="let p of produtosFiltrados" class="table-row">
                <!-- Produto e Categoria -->
                <td>
                  <div class="prod-main">
                    <div class="prod-nome">{{ p.nome }}</div>
                    <div class="prod-sub">
                      <span class="category-tag">{{ p.categoria }}</span>
                      <span *ngIf="p.lote" class="lote-tag">Lote: {{ p.lote }}</span>
                    </div>
                  </div>
                </td>

                <!-- Código de Barras -->
                <td>
                  <code class="barcode-badge">{{ p.codigoBarras || 'S/ CÓDIGO' }}</code>
                </td>

                <!-- Preços e Margem -->
                <td>
                  <div class="price-box">
                    <span class="price-venda">{{ p.precoVenda | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                    <span class="price-custo">Custo: {{ p.precoCusto | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                  </div>
                </td>

                <!-- Estoque com Barra Visual e Alerta de Baixo Estoque -->
                <td>
                  <div class="stock-cell">
                    <div class="stock-header">
                      <strong class="stock-qty" [class.text-danger]="p.estoqueAtual <= 0" [class.text-warning]="p.estoqueAtual <= p.estoqueMinimo">
                        {{ p.estoqueAtual }} {{ p.unidade }}
                      </strong>
                      <span class="stock-min">(Mín: {{ p.estoqueMinimo }})</span>
                    </div>

                    <!-- Barra de progresso de estoque -->
                    <div class="stock-bar-track">
                      <div
                        class="stock-bar-fill"
                        [style.width.%]="calcularProgressoEstoque(p)"
                        [class.fill-danger]="p.estoqueAtual <= 0"
                        [class.fill-warning]="p.estoqueAtual > 0 && p.estoqueAtual <= p.estoqueMinimo"
                        [class.fill-ok]="p.estoqueAtual > p.estoqueMinimo">
                      </div>
                    </div>

                    <span *ngIf="p.estoqueAtual <= p.estoqueMinimo" class="badge badge-warning stock-badge">
                      ⚠️ Reposição Necessária
                    </span>
                  </div>
                </td>

                <!-- Validade com Alertas -->
                <td>
                  <div class="expiry-cell">
                    <span class="expiry-date">{{ formatarData(p.dataValidade) }}</span>

                    <!-- Alertas Visuais de Validade -->
                    <span *ngIf="getStatusValidade(p) === 'VENCIDO'" class="badge badge-danger">
                      ❌ Vencido há {{ getDiasAbsolutos(p) }} dias
                    </span>
                    <span *ngIf="getStatusValidade(p) === 'CRITICO'" class="badge badge-danger">
                      ⏰ Vence em {{ p.diasParaVencer }} dias
                    </span>
                    <span *ngIf="getStatusValidade(p) === 'ALERTA'" class="badge badge-warning">
                      ⚠️ Vence em {{ p.diasParaVencer }} dias
                    </span>
                    <span *ngIf="getStatusValidade(p) === 'REGULAR'" class="badge badge-success">
                      ✓ Válido
                    </span>
                    <span *ngIf="!p.dataValidade" class="badge badge-info">
                      Sem Validade
                    </span>
                  </div>
                </td>

                <!-- Ações -->
                <td style="text-align: right;">
                  <div class="action-buttons">
                    <button (click)="abrirModalAjuste(p)" class="btn-action btn-adjust" title="Movimentar Estoque (Entrada / Saída)">
                      <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                      </svg>
                      <span>Estoque</span>
                    </button>
                    <button (click)="abrirModalEditar(p)" class="btn-action btn-edit" title="Editar Produto">
                      <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button (click)="excluirProduto(p)" class="btn-action btn-delete" title="Desativar Produto">
                      <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal de Cadastro / Edição de Produto -->
      <div *ngIf="modalProdutoAberto" class="modal-backdrop animate-fade-in">
        <div class="modal-box modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">{{ produtoEmEdicao.id ? 'Editar Produto Natural' : 'Cadastrar Novo Produto Natural' }}</h3>
            <button (click)="modalProdutoAberto = false" class="btn-close-modal">✕</button>
          </div>

          <form (ngSubmit)="salvarProduto()" class="modal-body form-grid">
            <div class="form-group full-width">
              <label>Nome do Produto *</label>
              <input type="text" [(ngModel)]="produtoEmEdicao.nome" name="nome" required placeholder="Ex: Chá Verde com Hortelã 100g" />
            </div>

            <div class="form-group">
              <label>Código de Barras / SKU</label>
              <input type="text" [(ngModel)]="produtoEmEdicao.codigoBarras" name="codigoBarras" placeholder="Ex: 7891234567890" />
            </div>

            <div class="form-group">
              <label>Categoria *</label>
              <select [(ngModel)]="produtoEmEdicao.categoria" name="categoria" required>
                <option value="Chás e Ervas">Chás e Ervas</option>
                <option value="Castanhas e Grãos">Castanhas e Grãos</option>
                <option value="Farinhas e Fibras">Farinhas e Fibras</option>
                <option value="Suplementos Naturais">Suplementos Naturais</option>
                <option value="Mel e Apícolas">Mel e Apícolas</option>
                <option value="Óleos e Encapsulados">Óleos e Encapsulados</option>
                <option value="Snacks Saudáveis">Snacks Saudáveis</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Pães">Pães</option>
              </select>
            </div>

            <div class="form-group">
              <label>Unidade de Medida</label>
              <select [(ngModel)]="produtoEmEdicao.unidade" name="unidade">
                <option value="UN">Unidade (UN)</option>
                <option value="KG">Quilograma (KG)</option>
                <option value="PCT">Pacote (PCT)</option>
                <option value="POTE">Pote (POTE)</option>
                <option value="G">Gramas (G)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Preço de Custo (R$) *</label>
              <input type="number" step="0.01" [(ngModel)]="produtoEmEdicao.precoCusto" name="precoCusto" required />
            </div>

            <div class="form-group">
              <label>Preço de Venda (R$) *</label>
              <input type="number" step="0.01" [(ngModel)]="produtoEmEdicao.precoVenda" name="precoVenda" required />
            </div>

            <div class="form-group">
              <label>Estoque Atual *</label>
              <input type="number" step="0.1" [(ngModel)]="produtoEmEdicao.estoqueAtual" name="estoqueAtual" required />
            </div>

            <div class="form-group">
              <label>Estoque Mínimo (Alerta de Reposição) *</label>
              <input type="number" step="0.1" [(ngModel)]="produtoEmEdicao.estoqueMinimo" name="estoqueMinimo" required />
            </div>

            <div class="form-group">
              <label>Data de Validade (Monitoramento de Alerta)</label>
              <input type="date" [(ngModel)]="produtoEmEdicao.dataValidade" name="dataValidade" />
            </div>

            <div class="form-group">
              <label>Número do Lote</label>
              <input type="text" [(ngModel)]="produtoEmEdicao.lote" name="lote" placeholder="Ex: L-2026A" />
            </div>

            <div class="form-group full-width">
              <label>Descrição e Propriedades</label>
              <textarea [(ngModel)]="produtoEmEdicao.descricao" name="descricao" rows="3" placeholder="Informações nutricionais ou descrição do produto natural"></textarea>
            </div>

            <div class="modal-footer full-width">
              <button type="button" (click)="modalProdutoAberto = false" class="btn-secondary">Cancelar</button>
              <button type="submit" class="btn-primary">Salvar Produto</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Ajuste Rápido de Estoque -->
      <div *ngIf="modalAjusteAberto" class="modal-backdrop animate-fade-in">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title">Movimentar Estoque: {{ produtoSelecionadoAjuste?.nome }}</h3>
            <button (click)="modalAjusteAberto = false" class="btn-close-modal">✕</button>
          </div>

          <div class="modal-body">
            <div class="current-stock-callout">
              Estoque Atual: <strong>{{ produtoSelecionadoAjuste?.estoqueAtual }} {{ produtoSelecionadoAjuste?.unidade }}</strong>
            </div>

            <form (ngSubmit)="confirmarAjuste()" class="form-fields">
              <div class="form-group">
                <label>Tipo de Movimentação</label>
                <select [(ngModel)]="ajusteEstoque.tipo" name="tipoAjuste">
                  <option value="ENTRADA">➕ Entrada (Compra / Reposição de Fornecedor)</option>
                  <option value="SAIDA">➖ Saída (Avaria / Quebra / Descarte / Consumo)</option>
                  <option value="AJUSTE">🔄 Ajuste Direto de Inventário (Novo Saldo Real)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Quantidade</label>
                <input type="number" step="0.1" min="0.1" [(ngModel)]="ajusteEstoque.quantidade" name="qtdAjuste" required />
              </div>

              <div class="form-group">
                <label>Motivo da Movimentação</label>
                <input type="text" [(ngModel)]="ajusteEstoque.motivo" name="motivoAjuste" placeholder="Ex: Entrada NF 1042 ou Contagem mensal" />
              </div>

              <div class="modal-footer">
                <button type="button" (click)="modalAjusteAberto = false" class="btn-secondary">Cancelar</button>
                <button type="submit" class="btn-primary">Confirmar Movimentação</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .estoque-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .estoque-header {
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

    /* Cards de Resumo e Abas Rápidas */
    .alert-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .alert-kpi-card {
      background: #ffffff;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
    }

    .alert-kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .alert-kpi-card.active-tab {
      border-color: var(--primary);
      background: #f0fdf4;
      box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.2);
    }

    .card-warning.active-tab {
      border-color: #f59e0b;
      background: #fffbeb;
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
    }

    .card-alert.active-tab {
      border-color: #ea580c;
      background: #fff7ed;
      box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.2);
    }

    .card-danger.active-tab {
      border-color: #ef4444;
      background: #fef2f2;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }

    .kpi-num {
      font-size: 1.85rem;
      font-weight: 800;
      line-height: 1.1;
    }

    .kpi-desc {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-top: 6px;
    }

    .text-primary { color: var(--primary); }
    .text-warning { color: #d97706; }
    .text-orange { color: #ea580c; }
    .text-danger { color: #ef4444; }

    /* Barra de Ferramentas */
    .toolbar-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 280px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      width: 20px;
      height: 20px;
      color: var(--text-light);
    }

    .search-box input {
      width: 100%;
      padding: 10px 40px 10px 42px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.92rem;
      background: #f8fafc;
    }

    .search-box input:focus {
      outline: none;
      border-color: var(--primary);
      background: #ffffff;
    }

    .btn-clear-search {
      position: absolute;
      right: 12px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .category-filter select {
      padding: 10px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.92rem;
      background: #ffffff;
      cursor: pointer;
    }

    /* Tabela */
    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .prod-main {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .prod-nome {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-main);
    }

    .prod-sub {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .category-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      color: var(--text-muted);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .lote-tag {
      font-size: 0.75rem;
      color: var(--text-light);
    }

    .barcode-badge {
      background: #f8fafc;
      border: 1px solid var(--border);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #334155;
    }

    .price-box {
      display: flex;
      flex-direction: column;
    }

    .price-venda {
      font-weight: 700;
      color: var(--primary-dark);
      font-size: 0.95rem;
    }

    .price-custo {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Célula de Estoque */
    .stock-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 140px;
    }

    .stock-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stock-qty {
      font-size: 0.95rem;
    }

    .stock-min {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .stock-bar-track {
      width: 100%;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .stock-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .fill-ok { background: #22c55e; }
    .fill-warning { background: #f59e0b; }
    .fill-danger { background: #ef4444; }

    .stock-badge {
      align-self: flex-start;
      margin-top: 2px;
    }

    /* Célula de Validade */
    .expiry-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
    }

    .expiry-date {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Ações */
    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn-action {
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .btn-adjust {
      background: var(--primary-soft);
      color: var(--primary-dark);
      border: 1px solid var(--primary-border);
    }

    .btn-adjust:hover {
      background: #dcfce7;
    }

    .btn-edit {
      background: var(--bg-surface);
      color: var(--text-main);
      border: 1px solid var(--border);
    }

    .btn-edit:hover {
      background: #e2e8f0;
    }

    .btn-delete {
      background: #fef2f2;
      color: #ef4444;
      border: 1px solid #fecaca;
    }

    .btn-delete:hover {
      background: #fee2e2;
    }

    .btn-icon {
      width: 15px;
      height: 15px;
    }

    .empty-table-row {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }

    /* Modais */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-box {
      background: #ffffff;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .modal-lg {
      max-width: 700px;
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .btn-close-modal {
      font-size: 1.2rem;
      color: var(--text-muted);
    }

    .modal-body {
      padding: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .form-group input, .form-group select, .form-group textarea {
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.92rem;
      background: #fdfdfd;
    }

    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }

    .current-stock-callout {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      color: #166534;
      font-size: 0.95rem;
      margin-bottom: 16px;
    }

    /* Responsivo: tablets e celulares */
    @media (max-width: 768px) {
      .estoque-container {
        padding: 20px 16px;
        gap: 18px;
      }

      .page-title {
        font-size: 1.4rem;
      }

      .estoque-header .btn-primary {
        width: 100%;
        justify-content: center;
      }

      .toolbar-card {
        padding: 14px 16px;
      }

      .search-box {
        min-width: 0;
        width: 100%;
      }

      .category-filter {
        width: 100%;
      }

      .category-filter select {
        width: 100%;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .modal-lg {
        max-width: 100%;
      }

      .action-buttons {
        flex-wrap: wrap;
        justify-content: flex-start;
      }
    }

    @media (max-width: 480px) {
      .alert-kpi-grid {
        grid-template-columns: 1fr 1fr;
      }

      .kpi-num {
        font-size: 1.4rem;
      }
    }
  `]
})
export class EstoqueComponent implements OnInit {
  produtoService = inject(ProdutoService);
  private cdr = inject(ChangeDetectorRef);

  produtos: Produto[] = [];
  produtosFiltrados: Produto[] = [];
  categorias: string[] = [];

  termoBusca = '';
  categoriaSelecionada = '';
  filtroAba = 'todos'; // 'todos', 'estoque_baixo', 'validade_proxima', 'vencidos'

  // Modais
  modalProdutoAberto = false;
  modalAjusteAberto = false;

  produtoEmEdicao: Produto = this.criarProdutoVazio();
  produtoSelecionadoAjuste: Produto | null = null;
  ajusteEstoque: AjusteEstoque = { tipo: 'ENTRADA', quantidade: 1, motivo: '' };

  ngOnInit(): void {
    this.carregarProdutos();
    this.carregarCategorias();
  }

  carregarProdutos(): void {
    this.produtoService.getProdutos().subscribe({
      next: (res) => {
        this.produtos = res;
        this.filtrar();
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  carregarCategorias(): void {
    this.produtoService.getCategorias().subscribe({
      next: (res) => {
        this.categorias = res;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  selecionarAba(aba: string): void {
    this.filtroAba = aba;
    this.filtrar();
  }

  filtrar(): void {
    const termo = this.termoBusca.toLowerCase().trim();

    this.produtosFiltrados = this.produtos.filter(p => {
      // Filtro por texto
      const matchTexto = !termo ||
        p.nome.toLowerCase().includes(termo) ||
        (p.codigoBarras && p.codigoBarras.toLowerCase().includes(termo)) ||
        (p.lote && p.lote.toLowerCase().includes(termo));

      // Filtro por categoria
      const matchCat = !this.categoriaSelecionada || p.categoria === this.categoriaSelecionada;

      // Filtro por aba
      let matchAba = true;
      if (this.filtroAba === 'estoque_baixo') {
        matchAba = p.estoqueAtual <= p.estoqueMinimo;
      } else if (this.filtroAba === 'validade_proxima') {
        matchAba = p.diasParaVencer !== undefined && p.diasParaVencer !== null && p.diasParaVencer >= 0 && p.diasParaVencer <= 30;
      } else if (this.filtroAba === 'vencidos') {
        matchAba = p.diasParaVencer !== undefined && p.diasParaVencer !== null && p.diasParaVencer < 0;
      }

      return matchTexto && matchCat && matchAba;
    });
  }

  get totalEstoqueBaixo(): number {
    return this.produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo).length;
  }

  get totalValidadeProxima(): number {
    return this.produtos.filter(p => p.diasParaVencer !== undefined && p.diasParaVencer !== null && p.diasParaVencer >= 0 && p.diasParaVencer <= 30).length;
  }

  get totalVencidos(): number {
    return this.produtos.filter(p => p.diasParaVencer !== undefined && p.diasParaVencer !== null && p.diasParaVencer < 0).length;
  }

  calcularProgressoEstoque(p: Produto): number {
    if (!p.estoqueMinimo || p.estoqueMinimo <= 0) return 100;
    const ratio = (p.estoqueAtual / (p.estoqueMinimo * 2)) * 100;
    return Math.min(Math.max(ratio, 5), 100);
  }

  getStatusValidade(p: Produto): string {
    if (!p.dataValidade) return 'SEM_VALIDADE';
    if (p.diasParaVencer === undefined || p.diasParaVencer === null) return 'REGULAR';
    if (p.diasParaVencer < 0) return 'VENCIDO';
    if (p.diasParaVencer <= 15) return 'CRITICO';
    if (p.diasParaVencer <= 45) return 'ALERTA';
    return 'REGULAR';
  }

  getDiasAbsolutos(p: Produto): number {
    return Math.abs(p.diasParaVencer || 0);
  }

  formatarData(dataStr?: string): string {
    if (!dataStr) return 'Sem validade cadastrada';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  }

  abrirModalNovo(): void {
    this.produtoEmEdicao = this.criarProdutoVazio();
    this.modalProdutoAberto = true;
  }

  abrirModalEditar(p: Produto): void {
    this.produtoEmEdicao = { ...p };
    this.modalProdutoAberto = true;
  }

  salvarProduto(): void {
    if (this.produtoEmEdicao.id) {
      this.produtoService.atualizarProduto(this.produtoEmEdicao.id, this.produtoEmEdicao).subscribe({
        next: () => {
          this.modalProdutoAberto = false;
          this.carregarProdutos();
        }
      });
    } else {
      this.produtoService.criarProduto(this.produtoEmEdicao).subscribe({
        next: () => {
          this.modalProdutoAberto = false;
          this.carregarProdutos();
        }
      });
    }
  }

  abrirModalAjuste(p: Produto): void {
    this.produtoSelecionadoAjuste = p;
    this.ajusteEstoque = { tipo: 'ENTRADA', quantidade: 1, motivo: '' };
    this.modalAjusteAberto = true;
  }

  confirmarAjuste(): void {
    if (!this.produtoSelecionadoAjuste?.id) return;
    this.produtoService.ajustarEstoque(this.produtoSelecionadoAjuste.id, this.ajusteEstoque).subscribe({
      next: () => {
        this.modalAjusteAberto = false;
        this.carregarProdutos();
      }
    });
  }

  excluirProduto(p: Produto): void {
    if (!p.id) return;
    if (confirm(`Deseja realmente desativar o produto "${p.nome}"?`)) {
      this.produtoService.desativarProduto(p.id).subscribe({
        next: () => {
          this.carregarProdutos();
        }
      });
    }
  }

  private criarProdutoVazio(): Produto {
    return {
      nome: '',
      codigoBarras: '',
      categoria: 'Chás e Ervas',
      unidade: 'UN',
      precoCusto: 0,
      precoVenda: 0,
      estoqueAtual: 0,
      estoqueMinimo: 5,
      dataValidade: '',
      lote: '',
      descricao: ''
    };
  }
}
