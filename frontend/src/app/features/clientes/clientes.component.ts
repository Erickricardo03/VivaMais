import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../core/services/cliente.service';
import { Cliente } from '../../core/models/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="clientes-container">
      <!-- Cabeçalho -->
      <div class="clientes-header">
        <div>
          <h1 class="page-title">Clientes & Relacionamento</h1>
          <p class="page-subtitle">Acompanhe quem comprou recentemente e quem já não aparece há um tempo.</p>
        </div>
        <div class="header-actions">
          <button (click)="abrirModalNovo()" class="btn-primary">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card" (click)="filtro = 'todos'" [class.active-tab]="filtro === 'todos'">
          <div class="kpi-num text-primary">{{ clientes().length }}</div>
          <div class="kpi-desc">Total de Clientes</div>
        </div>

        <div class="kpi-card card-ok" (click)="filtro = 'ativos'" [class.active-tab]="filtro === 'ativos'">
          <div class="kpi-num text-ok">{{ contarAtivos() }}</div>
          <div class="kpi-desc">✓ Ativos (até 30 dias)</div>
        </div>

        <div class="kpi-card card-warning" (click)="filtro = 'inativos'" [class.active-tab]="filtro === 'inativos'">
          <div class="kpi-num text-warning">{{ contarPorFaixa(30, 90) }}</div>
          <div class="kpi-desc">⚠️ Sumindo (30-90 dias)</div>
        </div>

        <div class="kpi-card card-danger" (click)="filtro = 'sumidos'" [class.active-tab]="filtro === 'sumidos'">
          <div class="kpi-num text-danger">{{ contarPorFaixa(90, Infinity) }}</div>
          <div class="kpi-desc">❌ Não voltam há +90 dias</div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="card toolbar-card">
        <div class="search-box">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            [(ngModel)]="termoBusca"
            placeholder="Buscar por nome, telefone ou e-mail..."
          />
          <button *ngIf="termoBusca" (click)="termoBusca = ''" class="btn-clear-search">✕</button>
        </div>

        <div class="threshold-select">
          <label>Considerar inativo após</label>
          <select [(ngModel)]="diasLimiteInativo">
            <option [ngValue]="30">30 dias</option>
            <option [ngValue]="60">60 dias</option>
            <option [ngValue]="90">90 dias</option>
            <option [ngValue]="180">180 dias</option>
          </select>
        </div>
      </div>

      <!-- Tabela -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Última Compra</th>
                <th>Histórico</th>
                <th style="text-align: right;">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="clientesFiltrados().length === 0">
                <td colspan="5" class="empty-table-row">
                  Nenhum cliente encontrado com os filtros selecionados.
                </td>
              </tr>

              <tr *ngFor="let c of clientesFiltrados()" class="table-row">
                <td>
                  <div class="prod-main">
                    <div class="prod-nome">{{ c.nome }}</div>
                    <div *ngIf="c.observacoes" class="obs-tag">{{ c.observacoes }}</div>
                  </div>
                </td>

                <td>
                  <div class="contact-box">
                    <span *ngIf="c.telefone">{{ c.telefone }}</span>
                    <span *ngIf="c.email" class="contact-email">{{ c.email }}</span>
                    <span *ngIf="!c.telefone && !c.email" class="contact-email">Sem contato cadastrado</span>
                  </div>
                </td>

                <td>
                  <div class="expiry-cell">
                    <span class="expiry-date">{{ formatarData(c.ultimaCompra) }}</span>
                    <span *ngIf="diasSemComprar(c) === Infinity" class="badge badge-info">Nunca comprou</span>
                    <span *ngIf="diasSemComprar(c) < 30 && diasSemComprar(c) !== Infinity" class="badge badge-success">
                      ✓ Ativo
                    </span>
                    <span *ngIf="diasSemComprar(c) >= 30 && diasSemComprar(c) < diasLimiteInativo" class="badge badge-info">
                      {{ diasSemComprar(c) }} dias sem comprar
                    </span>
                    <span *ngIf="diasSemComprar(c) >= diasLimiteInativo && diasSemComprar(c) < 90" class="badge badge-warning">
                      ⚠️ {{ diasSemComprar(c) }} dias sem comprar
                    </span>
                    <span *ngIf="diasSemComprar(c) >= 90" class="badge badge-danger">
                      ❌ Sumiu há {{ diasSemComprar(c) }} dias
                    </span>
                  </div>
                </td>

                <td>
                  <div class="price-box">
                    <span class="price-venda">{{ c.totalCompras }} compra(s)</span>
                    <span class="price-custo">Total: {{ c.valorTotalGasto | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                  </div>
                </td>

                <td style="text-align: right;">
                  <div class="action-buttons">
                    <a
                      *ngIf="c.telefone"
                      [href]="linkWhatsapp(c)"
                      target="_blank"
                      rel="noopener"
                      class="btn-action btn-contact"
                      title="Chamar no WhatsApp para reativar o cliente">
                      <span>💬 Contato</span>
                    </a>
                    <button (click)="abrirModalEditar(c)" class="btn-action btn-edit" title="Editar Cliente">
                      <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button (click)="excluirCliente(c)" class="btn-action btn-delete" title="Remover Cliente">
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

      <!-- Modal de Cadastro / Edição -->
      <div *ngIf="modalAberto" class="modal-backdrop animate-fade-in">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title">{{ clienteEmEdicao.id ? 'Editar Cliente' : 'Cadastrar Novo Cliente' }}</h3>
            <button (click)="modalAberto = false" class="btn-close-modal">✕</button>
          </div>

          <form (ngSubmit)="salvarCliente()" class="modal-body form-grid">
            <div class="form-group full-width">
              <label>Nome *</label>
              <input type="text" [(ngModel)]="clienteEmEdicao.nome" name="nome" required placeholder="Ex: Maria Souza" />
            </div>

            <div class="form-group">
              <label>Telefone / WhatsApp</label>
              <input type="text" [(ngModel)]="clienteEmEdicao.telefone" name="telefone" placeholder="(11) 90000-0000" />
            </div>

            <div class="form-group">
              <label>E-mail</label>
              <input type="email" [(ngModel)]="clienteEmEdicao.email" name="email" placeholder="cliente@email.com" />
            </div>

            <div class="form-group full-width">
              <label>Observações</label>
              <input type="text" [(ngModel)]="clienteEmEdicao.observacoes" name="observacoes" placeholder="Ex: Prefere chás sem cafeína" />
            </div>

            <div class="modal-footer full-width">
              <button type="button" (click)="modalAberto = false" class="btn-secondary">Cancelar</button>
              <button type="submit" class="btn-primary">Salvar Cliente</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clientes-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .clientes-header {
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

    .icon { width: 18px; height: 18px; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background: #ffffff;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .kpi-card.active-tab {
      border-color: var(--primary);
      background: #f0fdf4;
      box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.2);
    }

    .card-warning.active-tab {
      border-color: #f59e0b;
      background: #fffbeb;
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
    }

    .card-danger.active-tab {
      border-color: #ef4444;
      background: #fef2f2;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }

    .card-ok.active-tab {
      border-color: var(--primary);
      background: #f0fdf4;
      box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.2);
    }

    .kpi-num { font-size: 1.85rem; font-weight: 800; line-height: 1.1; }
    .kpi-desc { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-top: 6px; }

    .text-primary { color: var(--primary); }
    .text-ok { color: var(--primary); }
    .text-warning { color: #d97706; }
    .text-danger { color: #ef4444; }

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

    .threshold-select {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .threshold-select select {
      padding: 10px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.92rem;
      background: #ffffff;
      cursor: pointer;
    }

    .table-card { padding: 0; overflow: hidden; }
    .table-responsive { overflow-x: auto; }

    .prod-main { display: flex; flex-direction: column; gap: 4px; }
    .prod-nome { font-weight: 700; font-size: 0.95rem; color: var(--text-main); }
    .obs-tag { font-size: 0.78rem; color: var(--text-light); font-style: italic; }

    .contact-box { display: flex; flex-direction: column; gap: 2px; font-size: 0.85rem; color: var(--text-main); }
    .contact-email { font-size: 0.78rem; color: var(--text-muted); }

    .price-box { display: flex; flex-direction: column; }
    .price-venda { font-weight: 700; color: var(--primary-dark); font-size: 0.9rem; }
    .price-custo { font-size: 0.75rem; color: var(--text-muted); }

    .expiry-cell { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
    .expiry-date { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }

    .action-buttons { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }

    .btn-action {
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      text-decoration: none;
    }

    .btn-contact {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid var(--primary-border);
    }
    .btn-contact:hover { background: #dcfce7; }

    .btn-edit { background: var(--bg-surface); color: var(--text-main); border: 1px solid var(--border); }
    .btn-edit:hover { background: #e2e8f0; }

    .btn-delete { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
    .btn-delete:hover { background: #fee2e2; }

    .btn-icon { width: 15px; height: 15px; }

    .empty-table-row { text-align: center; padding: 40px; color: var(--text-muted); }

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

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title { font-size: 1.25rem; font-weight: 800; color: var(--text-main); }
    .btn-close-modal { font-size: 1.2rem; color: var(--text-muted); }
    .modal-body { padding: 24px; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }

    .form-group input, .form-group select, .form-group textarea {
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.92rem;
      background: #fdfdfd;
    }

    .form-group input:focus { outline: none; border-color: var(--primary); }

    .modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 16px; }

    /* Responsivo: tablets e celulares */
    @media (max-width: 768px) {
      .clientes-container {
        padding: 20px 16px;
        gap: 18px;
      }

      .page-title {
        font-size: 1.4rem;
      }

      .clientes-header .btn-primary {
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

      .threshold-select {
        width: 100%;
        justify-content: space-between;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .kpi-grid {
        grid-template-columns: 1fr 1fr;
      }

      .kpi-num {
        font-size: 1.4rem;
      }
    }
  `]
})
export class ClientesComponent implements OnInit {
  clienteService = inject(ClienteService);

  clientes = this.clienteService.clientes;
  Infinity = Infinity;

  termoBusca = '';
  filtro: 'todos' | 'ativos' | 'inativos' | 'sumidos' = 'todos';
  diasLimiteInativo = 30;

  modalAberto = false;
  clienteEmEdicao: Cliente = this.criarClienteVazio();

  ngOnInit(): void {}

  diasSemComprar(c: Cliente): number {
    return this.clienteService.diasSemComprar(c);
  }

  contarAtivos(): number {
    return this.clientes().filter(c => this.diasSemComprar(c) < 30).length;
  }

  contarPorFaixa(min: number, max: number): number {
    return this.clientes().filter(c => {
      const dias = this.diasSemComprar(c);
      return dias >= min && dias < max;
    }).length;
  }

  clientesFiltrados(): Cliente[] {
    const termo = this.termoBusca.toLowerCase().trim();

    return this.clientes().filter(c => {
      const matchTexto = !termo ||
        c.nome.toLowerCase().includes(termo) ||
        (c.telefone && c.telefone.toLowerCase().includes(termo)) ||
        (c.email && c.email.toLowerCase().includes(termo));

      const dias = this.diasSemComprar(c);
      let matchFiltro = true;
      if (this.filtro === 'ativos') {
        matchFiltro = dias < 30;
      } else if (this.filtro === 'inativos') {
        matchFiltro = dias >= 30 && dias < 90;
      } else if (this.filtro === 'sumidos') {
        matchFiltro = dias >= 90;
      }

      return matchTexto && matchFiltro;
    }).sort((a, b) => this.diasSemComprar(b) - this.diasSemComprar(a));
  }

  linkWhatsapp(c: Cliente): string {
    const numero = (c.telefone || '').replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá ${c.nome}! Sentimos sua falta na VivaMais Produtos Naturais 🌿 Notamos que faz um tempo desde sua última compra. Que tal dar uma passada por aqui? Temos novidades esperando por você!`
    );
    return `https://wa.me/55${numero}?text=${mensagem}`;
  }

  formatarData(dataStr?: string): string {
    if (!dataStr) return 'Nunca comprou';
    const d = new Date(dataStr);
    return d.toLocaleDateString('pt-BR');
  }

  abrirModalNovo(): void {
    this.clienteEmEdicao = this.criarClienteVazio();
    this.modalAberto = true;
  }

  abrirModalEditar(c: Cliente): void {
    this.clienteEmEdicao = { ...c };
    this.modalAberto = true;
  }

  salvarCliente(): void {
    if (!this.clienteEmEdicao.nome.trim()) return;

    if (this.clienteEmEdicao.id) {
      this.clienteService.atualizarCliente(this.clienteEmEdicao.id, this.clienteEmEdicao).subscribe({
        next: () => this.modalAberto = false,
        error: (err) => alert(err?.error?.message || 'Erro ao atualizar cliente.')
      });
    } else {
      this.clienteService.criarCliente({
        nome: this.clienteEmEdicao.nome,
        telefone: this.clienteEmEdicao.telefone,
        email: this.clienteEmEdicao.email,
        observacoes: this.clienteEmEdicao.observacoes,
        ultimaCompra: undefined
      }).subscribe({
        next: () => this.modalAberto = false,
        error: (err) => alert(err?.error?.message || 'Erro ao cadastrar cliente.')
      });
    }
  }

  excluirCliente(c: Cliente): void {
    if (confirm(`Deseja realmente remover o cliente "${c.nome}"?`)) {
      this.clienteService.excluirCliente(c.id).subscribe({
        error: (err) => alert(err?.error?.message || 'Erro ao remover cliente.')
      });
    }
  }

  private criarClienteVazio(): Cliente {
    return {
      id: 0,
      nome: '',
      telefone: '',
      email: '',
      observacoes: '',
      dataCadastro: '',
      totalCompras: 0,
      valorTotalGasto: 0
    };
  }
}
