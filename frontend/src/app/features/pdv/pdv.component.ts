import { Component, ChangeDetectorRef, ElementRef, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { ProdutoService } from '../../core/services/produto.service';
import { VendaService } from '../../core/services/venda.service';
import { CaixaService } from '../../core/services/caixa.service';
import { ClienteService } from '../../core/services/cliente.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Produto, FormaPagamento, VendaRequest, VendaResponse, DespesaCaixa, Caixa, LeituraBalanca,
  isVendidoPorPeso, gramasParaQuantidadeEstoque, quantidadeEstoqueParaGramas
} from '../../core/models/models';

/** Incremento (em gramas) dos botões -/+ ao ajustar um produto vendido por peso no carrinho.
 *  1g permite fechar em qualquer gramatura exata (23g, 24g, 25g...), já que a venda a granel
 *  raramente cai num valor redondo — o operador também pode digitar o valor direto no campo. */
const PASSO_GRAMAS = 1;
const GRAMAS_INICIAIS = 100;

/** Layout do código de barras da etiqueta de balança: 1 dígito indicador ("2") + 5 dígitos de
 *  código do produto + 6 dígitos de valor em centavos + 1 dígito verificador = 13 dígitos. */
const PADRAO_CODIGO_BALANCA = /^2\d{12}$/;

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

@Component({
  selector: 'app-pdv',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pdv-container">
      <!-- Topbar do PDV -->
      <div class="pdv-topbar">
        <div class="pdv-title-box">
          <span class="pdv-badge">Frente de Caixa</span>
          <h1 class="pdv-title">Ponto de Venda (PDV) VivaMais</h1>
        </div>

        <div class="pdv-quick-stats">
          <div class="stat-pill" [class.pill-danger]="!caixaAberto" [class.pill-ok]="caixaAberto">
            <span class="pill-label">Caixa:</span>
            <span class="pill-val" *ngIf="caixaAberto">{{ caixaService.caixaAtual()?.operador }} (Aberto)</span>
            <span class="pill-val" *ngIf="!caixaAberto">Fechado</span>
          </div>
          <div class="stat-pill pill-gold">
            <span class="pill-label">Itens no Carrinho:</span>
            <span class="pill-val">{{ carrinho.length }}</span>
          </div>
          <button *ngIf="!caixaAberto" (click)="abrirModalAbrirCaixa()" class="btn-primary btn-caixa-action">
            <span>🔓 Abrir Caixa</span>
          </button>
          <button *ngIf="caixaAberto" (click)="abrirModalFecharCaixa()" class="btn-secondary btn-caixa-action">
            <span>🔒 Fechar Caixa</span>
          </button>
        </div>
      </div>

      <!-- Aviso de Caixa Fechado -->
      <div *ngIf="!caixaAberto" class="caixa-fechado-banner">
        <span>⚠️ O caixa está fechado. Abra o caixa informando o valor inicial de troco para começar a vender.</span>
        <button (click)="abrirModalAbrirCaixa()" class="btn-primary">Abrir Caixa Agora</button>
      </div>

      <!-- Layout Dividido em Duas Colunas -->
      <div class="pdv-layout">
        <!-- Coluna Esquerda: Catálogo & Busca Rápida -->
        <div class="pdv-catalog-col">
          <!-- Campo de Busca por Leitor de Código de Barras / Nome -->
          <div class="pdv-search-bar card">
            <div class="search-input-wrapper">
              <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
              <input
                type="text"
                [(ngModel)]="termoBusca"
                (ngModelChange)="filtrarCatalogo()"
                (keydown.enter)="adicionarPrimeiroResultado()"
                placeholder="Bipe com o leitor ou digite o nome / código de barras (Enter para adicionar)..."
                autofocus
              />
              <button type="button" (click)="abrirScanner()" class="btn-scan-camera" title="Escanear com a câmera (produto ou etiqueta da balança)">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9V7a2 2 0 012-2h2M3 15v2a2 2 0 002 2h2m10-14h2a2 2 0 012 2v2m-4 10h2a2 2 0 002-2v-2M7 12h10"/>
                </svg>
              </button>
            </div>

            <!-- Filtro de Categorias em Chips -->
            <div class="category-chips">
              <button
                class="chip-btn"
                [class.active]="categoriaAtiva === ''"
                (click)="categoriaAtiva = ''; filtrarCatalogo()">
                Todos os Produtos
              </button>
              <button
                *ngFor="let cat of categorias"
                class="chip-btn"
                [class.active]="categoriaAtiva === cat"
                (click)="categoriaAtiva = cat; filtrarCatalogo()">
                {{ cat }}
              </button>
            </div>
          </div>

          <!-- Grade de Produtos para Seleção Rápida -->
          <div class="product-grid">
            <div
              *ngFor="let p of produtosFiltrados"
              (click)="adicionarAoCarrinho(p)"
              class="product-card"
              [class.out-of-stock]="p.estoqueAtual <= 0">
              <div class="product-header">
                <span class="product-cat">{{ p.categoria }}</span>
                <span class="product-stock" [class.stock-low]="p.estoqueAtual <= p.estoqueMinimo">
                  {{ p.estoqueAtual }} {{ p.unidade }}
                </span>
              </div>
              <h3 class="product-name">{{ p.nome }}</h3>
              <div class="product-footer">
                <span class="product-price">{{ p.precoVenda | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                <button class="btn-add-item" [disabled]="p.estoqueAtual <= 0">
                  <span *ngIf="p.estoqueAtual > 0">+ Adicionar</span>
                  <span *ngIf="p.estoqueAtual <= 0">Esgotado</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna Direita: Carrinho & Fechamento de Venda -->
        <div class="pdv-cart-col">
          <div class="card cart-card">
            <div class="cart-header">
              <div class="cart-title">
                <svg class="cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <span>Cupom Atual</span>
              </div>
              <button *ngIf="carrinho.length > 0" (click)="limparCarrinho()" class="btn-clear-cart" title="Limpar todo o carrinho">
                Limpar
              </button>
            </div>

            <!-- Seleção de Cliente (Opcional) -->
            <div class="cliente-select-box">
              <label class="cliente-label">Cliente (opcional):</label>
              <select [(ngModel)]="clienteSelecionadoId" name="clienteVenda" class="cliente-select">
                <option [ngValue]="''">Venda avulsa (sem cliente)</option>
                <option *ngFor="let c of clientes()" [ngValue]="c.id">{{ c.nome }}</option>
              </select>
            </div>

            <!-- Lista de Itens no Carrinho -->
            <div class="cart-items-list">
              <div *ngIf="carrinho.length === 0" class="empty-cart">
                <svg class="empty-cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                <p>Nenhum produto no carrinho</p>
                <span>Clique em um produto ou bipe o código de barras</span>
              </div>

              <div *ngFor="let item of carrinho; let idx = index" class="cart-item" [class.cart-item-peso]="isVendidoPorPeso(item.produto)">
                <div class="item-details">
                  <div class="item-name">{{ item.produto.nome }}</div>
                  <div class="item-unit-price">
                    {{ item.precoUnitario | currency:'BRL':'symbol':'1.2-2':'pt-BR' }} / {{ item.produto.unidade }}
                  </div>
                </div>

                <!-- Controles de Quantidade: unidade/pacote/pote (inteiro) -->
                <div class="item-qty-controls" *ngIf="!isVendidoPorPeso(item.produto)">
                  <button (click)="alterarQuantidade(idx, -1)" class="btn-qty">-</button>
                  <span class="item-qty">{{ item.quantidade }}</span>
                  <button (click)="alterarQuantidade(idx, 1)" class="btn-qty" [disabled]="item.quantidade >= item.produto.estoqueAtual">+</button>
                </div>

                <!-- Controles de Peso: produto vendido por KG/G, quantidade digitada em gramas -->
                <div class="item-qty-controls item-qty-peso" *ngIf="isVendidoPorPeso(item.produto)">
                  <button (click)="incrementarGramas(idx, -PASSO_GRAMAS)" class="btn-qty">-</button>
                  <div class="peso-input-group">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      class="peso-input"
                      [ngModel]="gramasDoItem(item)"
                      (ngModelChange)="definirGramasDoItem(idx, $event)"
                      [name]="'gramas-' + idx"
                    />
                    <span class="peso-unidade">g</span>
                  </div>
                  <button
                    (click)="incrementarGramas(idx, PASSO_GRAMAS)"
                    class="btn-qty"
                    [disabled]="gramasDoItem(item) >= quantidadeEstoqueParaGramas(item.produto, item.produto.estoqueAtual)">+</button>
                </div>

                <div class="item-subtotal">
                  {{ item.subtotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </div>

                <button (click)="removerItem(idx)" class="btn-remove-item" title="Remover item">✕</button>
              </div>
            </div>

            <!-- Totalizadores & Desconto -->
            <div class="cart-totals">
              <div class="total-line">
                <span>Subtotal:</span>
                <strong>{{ subtotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
              </div>

              <div class="total-line discount-line">
                <span>Desconto (R$):</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  [(ngModel)]="desconto"
                  (ngModelChange)="calcularTotais()"
                  class="discount-input"
                />
              </div>

              <div class="total-line grand-total-line">
                <span>TOTAL A PAGAR:</span>
                <span class="grand-total">{{ totalPagar | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
            </div>

            <!-- Formas de Pagamento -->
            <div class="payment-section">
              <label class="payment-title">Forma de Pagamento:</label>
              <div class="payment-options">
                <button
                  type="button"
                  [class.active]="formaPagamento === 'PIX'"
                  (click)="formaPagamento = 'PIX'"
                  class="payment-btn">
                  <span class="pay-icon">⚡</span> PIX
                </button>
                <button
                  type="button"
                  [class.active]="formaPagamento === 'CARTAO_CREDITO'"
                  (click)="formaPagamento = 'CARTAO_CREDITO'"
                  class="payment-btn">
                  <span class="pay-icon">💳</span> Crédito
                </button>
                <button
                  type="button"
                  [class.active]="formaPagamento === 'CARTAO_DEBITO'"
                  (click)="formaPagamento = 'CARTAO_DEBITO'"
                  class="payment-btn">
                  <span class="pay-icon">💳</span> Débito
                </button>
                <button
                  type="button"
                  [class.active]="formaPagamento === 'DINHEIRO'"
                  (click)="formaPagamento = 'DINHEIRO'"
                  class="payment-btn">
                  <span class="pay-icon">💵</span> Dinheiro
                </button>
              </div>

              <!-- Calculadora de Troco para Dinheiro -->
              <div *ngIf="formaPagamento === 'DINHEIRO'" class="cash-calculator animate-fade-in">
                <div class="cash-input-group">
                  <label>Valor Recebido (R$):</label>
                  <input
                    type="number"
                    step="1.00"
                    [(ngModel)]="valorRecebidoDinheiro"
                    (ngModelChange)="calcularTroco()"
                  />
                </div>
                <div class="troco-display" [class.troco-positivo]="troco >= 0" [class.troco-insuficiente]="troco < 0">
                  <span *ngIf="troco >= 0">Troco: <strong>{{ troco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong></span>
                  <span *ngIf="troco < 0">Falta: <strong>{{ (troco * -1) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong></span>
                </div>
              </div>

              <!-- QR Code Simulado para PIX -->
              <div *ngIf="formaPagamento === 'PIX'" class="pix-box animate-fade-in">
                <div class="pix-badge">PIX VivaMais • Chave CNPJ</div>
                <div class="pix-code">Chave: 12.345.678/0001-90</div>
                <span class="pix-hint">Aguardando confirmação do pagamento instantâneo</span>
              </div>
            </div>

            <!-- Botão de Finalização -->
            <button
              [disabled]="carrinho.length === 0 || finalizando || !caixaAberto || (formaPagamento === 'DINHEIRO' && troco < 0)"
              (click)="finalizarVenda()"
              class="btn-checkout">
              <span *ngIf="!caixaAberto">Abra o caixa para vender</span>
              <span *ngIf="caixaAberto && !finalizando">Finalizar Venda (Baixar Estoque)</span>
              <span *ngIf="caixaAberto && finalizando">Processando Venda...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de Comprovante / Cupom de Venda Emitido -->
      <div *ngIf="modalReciboAberto && vendaEmitida" class="modal-backdrop animate-fade-in">
        <div class="modal-box receipt-box">
          <div class="receipt-paper" id="reciboImprimir">
            <!-- Cabeçalho do Cupom com Marca VivaMais -->
            <div class="receipt-header">
              <img src="assets/logo.svg" alt="VivaMais" class="receipt-logo" onerror="this.src='assets/logo_cropped.jpg'" />
              <h2 class="receipt-company">VivaMais Produtos Naturais</h2>
              <p class="receipt-sub">Alimentos Saudáveis, Suplementos e Ervas</p>
              <p class="receipt-doc">CNPJ: 12.345.678/0001-90 • Inscrição: ISENTO</p>
              <div class="receipt-divider">--------------------------------------------------</div>
              <h3 class="receipt-voucher-title">CUPOM NÃO FISCAL DE VENDA</h3>
              <p class="receipt-meta">Venda: <strong>{{ vendaEmitida.numeroVenda }}</strong></p>
              <p class="receipt-meta">Data/Hora: {{ vendaEmitida.dataHora }}</p>
              <div class="receipt-divider">--------------------------------------------------</div>
            </div>

            <!-- Itens Vendidos -->
            <div class="receipt-items">
              <div class="receipt-item-header">
                <span>ITEM / DESCRIÇÃO</span>
                <span>QTD x UNIT</span>
                <span>TOTAL</span>
              </div>
              <div *ngFor="let it of vendaEmitida.itens" class="receipt-item-row">
                <div class="r-nome">{{ it.nomeProduto }}</div>
                <div class="r-calc">{{ it.quantidade }} x {{ it.precoUnitario | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
                <div class="r-sub">{{ (it.quantidade * it.precoUnitario) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
              </div>
            </div>

            <!-- Totais -->
            <div class="receipt-totals">
              <div class="receipt-divider">--------------------------------------------------</div>
              <div class="r-tot-line">
                <span>Subtotal:</span>
                <span>{{ vendaEmitida.subtotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div *ngIf="vendaEmitida.desconto > 0" class="r-tot-line">
                <span>Desconto:</span>
                <span>- {{ vendaEmitida.desconto | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="r-tot-line r-grand-total">
                <span>TOTAL A PAGAR:</span>
                <span>{{ vendaEmitida.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="r-tot-line">
                <span>Forma de Pagamento:</span>
                <span>{{ vendaEmitida.formaPagamento }}</span>
              </div>
              <div *ngIf="vendaEmitida.formaPagamento === 'DINHEIRO'" class="r-tot-line">
                <span>Valor Recebido:</span>
                <span>{{ vendaEmitida.valorRecebido | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div *ngIf="vendaEmitida.formaPagamento === 'DINHEIRO'" class="r-tot-line">
                <span>Troco:</span>
                <span>{{ vendaEmitida.troco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="receipt-divider">--------------------------------------------------</div>
            </div>

            <div class="receipt-footer">
              <p>Obrigado pela preferência!</p>
              <p>VivaMais - Viva com mais saúde e equilíbrio.</p>
            </div>
          </div>

          <!-- Ações do Modal -->
          <div class="receipt-actions">
            <button (click)="imprimirCupom()" class="btn-primary">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              <span>Imprimir Cupom</span>
            </button>
            <button (click)="modalReciboAberto = false" class="btn-secondary">Fechar</button>
          </div>
        </div>
      </div>

      <!-- Modal do Scanner de Câmera (produto normal ou etiqueta da balança) -->
      <div *ngIf="modalScannerAberto" class="modal-backdrop animate-fade-in">
        <div class="modal-box scanner-modal">
          <div class="modal-header">
            <h3 class="modal-title">Escanear Código de Barras</h3>
            <button (click)="fecharScanner()" class="btn-close-modal">✕</button>
          </div>
          <div class="modal-body">
            <p class="caixa-modal-hint">
              Aponte a câmera para o código de barras do produto ou para a etiqueta impressa pela balança de pesagem.
            </p>
            <div class="scanner-video-box">
              <video #scannerVideo class="scanner-video" autoplay muted playsinline></video>
              <div class="scanner-frame"></div>
            </div>
            <p *ngIf="scannerErro" class="scanner-erro">{{ scannerErro }}</p>
          </div>
        </div>
      </div>

      <!-- Modal de Confirmação de Item Pesado (lido da balança) -->
      <div *ngIf="leituraBalancaPendente" class="modal-backdrop animate-fade-in">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title">Confirmar Produto Pesado</h3>
          </div>
          <div class="modal-body">
            <p class="caixa-modal-hint">Confira os dados lidos da etiqueta da balança antes de adicionar ao carrinho.</p>
            <div class="fechamento-resumo-grid">
              <div class="resumo-item full-width-item">
                <span class="resumo-label">Produto</span>
                <span class="resumo-valor">{{ leituraBalancaPendente.nomeProduto }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Peso Lido</span>
                <span class="resumo-valor">{{ leituraBalancaPendente.pesoCalculado }} {{ leituraBalancaPendente.unidade }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Preço por {{ leituraBalancaPendente.unidade }}</span>
                <span class="resumo-valor">{{ leituraBalancaPendente.precoVenda | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="resumo-item full-width-item">
                <span class="resumo-label">Valor Total</span>
                <span class="resumo-valor grand-total">{{ leituraBalancaPendente.valorLido | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" (click)="cancelarLeituraBalanca()" class="btn-secondary">Cancelar</button>
              <button type="button" (click)="confirmarLeituraBalanca()" class="btn-primary">Adicionar ao Carrinho</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Abertura de Caixa -->
      <div *ngIf="modalAbrirCaixaAberto" class="modal-backdrop animate-fade-in">
        <div class="modal-box caixa-modal">
          <div class="modal-header">
            <h3 class="modal-title">Abertura de Caixa</h3>
          </div>
          <div class="modal-body">
            <p class="caixa-modal-hint">
              Informe o valor em dinheiro que está sendo colocado no caixa agora, para servir de troco nas vendas em espécie.
            </p>
            <div class="form-group">
              <label>Valor de Abertura / Troco Inicial (R$) *</label>
              <input
                type="number"
                step="1.00"
                min="0"
                [(ngModel)]="valorAberturaInput"
                name="valorAbertura"
                autofocus
              />
            </div>
            <div class="modal-footer">
              <button type="button" (click)="modalAbrirCaixaAberto = false" class="btn-secondary">Cancelar</button>
              <button type="button" (click)="confirmarAberturaCaixa()" class="btn-primary">Abrir Caixa</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Fechamento de Caixa -->
      <div *ngIf="modalFecharCaixaAberto" class="modal-backdrop animate-fade-in">
        <div class="modal-box caixa-modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">Fechamento de Caixa</h3>
            <button (click)="modalFecharCaixaAberto = false" class="btn-close-modal">✕</button>
          </div>
          <div class="modal-body">
            <!-- Resumo de Vendas por Forma de Pagamento -->
            <div class="fechamento-resumo-grid">
              <div class="resumo-item">
                <span class="resumo-label">Abertura (Troco Inicial)</span>
                <span class="resumo-valor">{{ caixaService.caixaAtual()?.valorAbertura | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Vendas em Dinheiro</span>
                <span class="resumo-valor">{{ caixaService.caixaAtual()?.vendasDinheiro | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Vendas PIX</span>
                <span class="resumo-valor">{{ caixaService.caixaAtual()?.vendasPix | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Vendas Cartão Crédito</span>
                <span class="resumo-valor">{{ caixaService.caixaAtual()?.vendasCartaoCredito | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Vendas Cartão Débito</span>
                <span class="resumo-valor">{{ caixaService.caixaAtual()?.vendasCartaoDebito | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Qtd. de Vendas</span>
                <span class="resumo-valor">{{ caixaService.caixaAtual()?.quantidadeVendas }}</span>
              </div>
            </div>

            <!-- Despesas de Caixa -->
            <div class="despesas-section">
              <h4 class="despesas-title">Despesas de Caixa</h4>
              <p class="caixa-modal-hint">
                Lance aqui saídas de dinheiro do caixa durante o dia (compras de fornecedor, sangria, manutenção, etc).
              </p>

              <div class="despesas-list" *ngIf="(caixaService.caixaAtual()?.despesas?.length || 0) > 0">
                <div *ngFor="let d of caixaService.caixaAtual()?.despesas" class="despesa-row">
                  <span class="despesa-desc">{{ d.descricao }}</span>
                  <span class="despesa-cat">{{ d.categoria }}</span>
                  <span class="despesa-valor">- {{ d.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                  <button (click)="removerDespesaCaixa(d.id)" class="btn-remove-item" title="Remover despesa">✕</button>
                </div>
              </div>

              <div class="despesa-form">
                <input type="text" [(ngModel)]="despesaDescricao" name="despesaDescricao" placeholder="Descrição da despesa" class="despesa-input-desc" />
                <select [(ngModel)]="despesaCategoria" name="despesaCategoria" class="despesa-input-cat">
                  <option value="FORNECEDOR">Fornecedor</option>
                  <option value="MANUTENCAO">Manutenção</option>
                  <option value="LIMPEZA">Limpeza</option>
                  <option value="ALIMENTACAO">Alimentação</option>
                  <option value="TRANSPORTE">Transporte</option>
                  <option value="SANGRIA">Sangria</option>
                  <option value="OUTROS">Outros</option>
                </select>
                <input type="number" step="0.50" min="0" [(ngModel)]="despesaValor" name="despesaValor" placeholder="Valor (R$)" class="despesa-input-valor" />
                <button type="button" (click)="adicionarDespesaCaixa()" class="btn-secondary">+ Lançar</button>
              </div>

              <div class="total-despesas-line">
                <span>Total de Despesas:</span>
                <strong>{{ caixaService.totalDespesas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
              </div>
            </div>

            <!-- Conferência de Caixa -->
            <div class="conferencia-section">
              <div class="conferencia-line">
                <span>Saldo Esperado em Dinheiro:</span>
                <strong>{{ caixaService.saldoEsperadoDinheiro | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
              </div>

              <div class="form-group">
                <label>Valor Contado no Caixa (R$) *</label>
                <input type="number" step="1.00" min="0" [(ngModel)]="valorContadoInput" name="valorContado" />
              </div>

              <div class="conferencia-line diferenca-line" [class.dif-positiva]="diferencaFechamento() >= 0" [class.dif-negativa]="diferencaFechamento() < 0">
                <span *ngIf="diferencaFechamento() >= 0">Sobra de Caixa:</span>
                <span *ngIf="diferencaFechamento() < 0">Falta de Caixa:</span>
                <strong>{{ (diferencaFechamento() * (diferencaFechamento() < 0 ? -1 : 1)) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
              </div>

              <div class="form-group">
                <label>Observações do Fechamento</label>
                <textarea [(ngModel)]="observacoesFechamento" name="observacoesFechamento" rows="2" placeholder="Ex: Diferença referente a troco arredondado"></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" (click)="modalFecharCaixaAberto = false" class="btn-secondary">Cancelar</button>
              <button type="button" (click)="confirmarFechamentoCaixa()" class="btn-primary">Confirmar Fechamento</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Resumo Pós-Fechamento -->
      <div *ngIf="caixaFechadoResumo" class="modal-backdrop animate-fade-in">
        <div class="modal-box caixa-modal">
          <div class="modal-header">
            <h3 class="modal-title">Caixa Fechado com Sucesso</h3>
          </div>
          <div class="modal-body">
            <div class="fechamento-resumo-grid">
              <div class="resumo-item">
                <span class="resumo-label">Total de Vendas</span>
                <span class="resumo-valor">{{ totalVendasResumo(caixaFechadoResumo) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Total de Despesas</span>
                <span class="resumo-valor">{{ totalDespesasResumo(caixaFechadoResumo) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Saldo Esperado</span>
                <span class="resumo-valor">{{ caixaFechadoResumo.saldoEsperadoFechamento | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="resumo-item">
                <span class="resumo-label">Valor Contado</span>
                <span class="resumo-valor">{{ caixaFechadoResumo.valorContadoFechamento | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
            </div>
            <div class="conferencia-line diferenca-line" [class.dif-positiva]="(caixaFechadoResumo.diferencaFechamento || 0) >= 0" [class.dif-negativa]="(caixaFechadoResumo.diferencaFechamento || 0) < 0">
              <span *ngIf="(caixaFechadoResumo.diferencaFechamento || 0) >= 0">Sobra de Caixa:</span>
              <span *ngIf="(caixaFechadoResumo.diferencaFechamento || 0) < 0">Falta de Caixa:</span>
              <strong>{{ (caixaFechadoResumo.diferencaFechamento || 0) * ((caixaFechadoResumo.diferencaFechamento || 0) < 0 ? -1 : 1) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
            <div class="modal-footer">
              <button type="button" (click)="caixaFechadoResumo = null" class="btn-primary">Concluir</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pdv-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .pdv-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .pdv-title-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pdv-badge {
      background: #15803d;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pdv-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .pdv-quick-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .stat-pill {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      padding: 6px 14px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pill-gold {
      border-color: #f59e0b;
      background: #fffbeb;
      color: #b45309;
      font-weight: 700;
    }

    .pill-ok {
      border-color: var(--primary);
      background: #f0fdf4;
      color: var(--primary-dark);
      font-weight: 700;
    }

    .pill-danger {
      border-color: #ef4444;
      background: #fef2f2;
      color: #b91c1c;
      font-weight: 700;
    }

    .btn-caixa-action {
      white-space: nowrap;
    }

    .caixa-fechado-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.9rem;
    }

    /* Seleção de Cliente no Carrinho */
    .cliente-select-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
    }

    .cliente-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .cliente-select {
      width: 100%;
      min-width: 0;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      background: #ffffff;
    }

    /* Modais de Caixa */
    .caixa-modal-hint {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 14px;
    }

    .caixa-modal .modal-body {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .fechamento-resumo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .full-width-item {
      grid-column: 1 / -1;
    }

    .grand-total {
      color: var(--primary-dark);
      font-size: 1.2rem;
    }

    /* Scanner de câmera */
    .scanner-video-box {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      background: #0f172a;
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .scanner-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .scanner-frame {
      position: absolute;
      inset: 15% 10%;
      border: 3px solid rgba(34, 197, 94, 0.85);
      border-radius: var(--radius-sm);
      box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.35);
      pointer-events: none;
    }

    .scanner-erro {
      margin-top: 12px;
      padding: 10px 14px;
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      font-size: 0.88rem;
    }

    .resumo-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
    }

    .resumo-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
    }

    .resumo-valor {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .despesas-section {
      border-top: 1px solid var(--border);
      padding-top: 14px;
    }

    .despesas-title {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 4px;
    }

    .despesas-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;
      max-height: 160px;
      overflow-y: auto;
    }

    .despesa-row {
      display: grid;
      grid-template-columns: 1fr auto auto 20px;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 6px 10px;
      font-size: 0.82rem;
    }

    .despesa-desc {
      font-weight: 600;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .despesa-cat {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .despesa-valor {
      font-weight: 700;
      color: #ef4444;
    }

    .despesa-form {
      display: grid;
      grid-template-columns: 2fr 1.3fr 1fr auto;
      gap: 8px;
    }

    .despesa-form input, .despesa-form select {
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }

    .total-despesas-line {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 0.95rem;
      color: #ef4444;
    }

    .conferencia-section {
      border-top: 1px solid var(--border);
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .conferencia-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.95rem;
    }

    .diferenca-line {
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      font-weight: 700;
    }

    .dif-positiva {
      background: #f0fdf4;
      color: var(--primary-dark);
      border: 1px solid var(--primary-border);
    }

    .dif-negativa {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .conferencia-section textarea {
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      resize: vertical;
    }

    /* Layout PDV */
    .pdv-layout {
      display: grid;
      grid-template-columns: 1fr 440px;
      gap: 24px;
      /* min-width: 0 nas colunas abaixo evita que o conteúdo interno force a
         página a ficar mais larga que a tela (comportamento padrão de itens
         de grid é não encolher além do seu conteúdo mínimo). */
      max-width: 100%;
    }

    @media (max-width: 1024px) {
      .pdv-layout {
        grid-template-columns: 1fr;
      }
    }

    /* Coluna do Catálogo */
    .pdv-catalog-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }

    .pdv-cart-col {
      min-width: 0;
    }

    .pdv-search-bar {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 16px 20px;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      width: 22px;
      height: 22px;
      color: var(--primary);
    }

    .search-input-wrapper input {
      width: 100%;
      padding: 14px 52px 14px 48px;
      border: 2px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 1rem;
      font-weight: 600;
      background: #ffffff;
    }

    .search-input-wrapper input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.15);
    }

    .btn-scan-camera {
      position: absolute;
      right: 8px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      color: var(--primary);
      background: var(--primary-soft);
      flex-shrink: 0;
    }

    .btn-scan-camera:hover {
      background: var(--primary);
      color: #ffffff;
    }

    .btn-scan-camera svg {
      width: 20px;
      height: 20px;
    }

    .category-chips {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .chip-btn {
      white-space: nowrap;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      background: var(--bg-surface);
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 600;
      border: 1px solid var(--border);
      transition: all 0.2s;
    }

    .chip-btn:hover {
      background: #e2e8f0;
    }

    .chip-btn.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }

    /* Grade de Produtos */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 14px;
      max-height: 640px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .product-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .product-card:hover:not(.out-of-stock) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--primary-light);
    }

    .product-card.out-of-stock {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f8fafc;
    }

    .product-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
    }

    .product-cat {
      color: var(--text-muted);
      font-weight: 600;
    }

    .product-stock {
      font-weight: 700;
      color: var(--primary);
    }

    .stock-low {
      color: #d97706;
    }

    .product-name {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.3;
      min-height: 40px;
    }

    .product-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
    }

    .product-price {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--primary-dark);
    }

    .btn-add-item {
      background: var(--primary-soft);
      color: var(--primary-dark);
      border: 1px solid var(--primary-border);
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 700;
    }

    .product-card:hover:not(.out-of-stock) .btn-add-item {
      background: var(--primary);
      color: #ffffff;
    }

    /* Coluna do Carrinho */
    .cart-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      min-height: 600px;
      min-width: 0;
    }

    .cart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }

    .cart-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .cart-icon {
      width: 22px;
      height: 22px;
      color: var(--primary);
    }

    .btn-clear-cart {
      font-size: 0.8rem;
      color: #ef4444;
      font-weight: 600;
    }

    .cart-items-list {
      flex: 1;
      overflow-y: auto;
      max-height: 260px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .empty-cart {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 180px;
      color: var(--text-muted);
      text-align: center;
      gap: 6px;
    }

    .empty-cart-icon {
      width: 40px;
      height: 40px;
      color: var(--text-light);
    }

    .cart-item {
      display: grid;
      grid-template-columns: 1fr auto auto 20px;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }

    /* Item vendido por peso: os controles de grama exigem mais espaço horizontal
       do que o stepper de unidade inteira, então o nome quebra para uma linha
       própria e os controles/subtotal/remover ficam juntos na linha de baixo. */
    .cart-item.cart-item-peso {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 8px;
    }

    .cart-item.cart-item-peso .item-details {
      flex: 1 1 100%;
      min-width: 0;
    }

    .cart-item.cart-item-peso .item-subtotal {
      margin-left: auto;
    }

    .item-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .item-unit-price {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .item-qty-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn-qty {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background: #ffffff;
      border: 1px solid var(--border);
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-qty {
      font-size: 0.88rem;
      font-weight: 700;
      min-width: 20px;
      text-align: center;
    }

    .item-qty-peso {
      gap: 3px;
    }

    .item-qty-peso .btn-qty {
      width: 20px;
      height: 20px;
      font-size: 0.78rem;
      flex-shrink: 0;
    }

    .peso-input-group {
      display: flex;
      align-items: center;
      gap: 1px;
      flex-shrink: 0;
    }

    .peso-input {
      width: 44px;
      padding: 2px 3px;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 0.78rem;
      font-weight: 700;
      text-align: center;
      /* remove as setinhas nativas do input number: os botões -/+ já cobrem
         o ajuste rápido, e a seta consumia parte da largura útil do campo,
         cortando visualmente números de 3 dígitos (ex: "250"). */
      -moz-appearance: textfield;
    }

    .peso-input::-webkit-outer-spin-button,
    .peso-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .peso-input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .peso-unidade {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .item-subtotal {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--text-main);
      text-align: right;
      white-space: nowrap;
    }

    .btn-remove-item {
      color: #94a3b8;
      font-size: 0.85rem;
    }

    .btn-remove-item:hover {
      color: #ef4444;
    }

    /* Totais */
    .cart-totals {
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      padding: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .total-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.95rem;
    }

    .discount-input {
      width: 80px;
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      text-align: right;
      font-weight: 700;
    }

    .grand-total-line {
      font-size: 1.15rem;
      font-weight: 900;
      margin-top: 4px;
    }

    .grand-total {
      color: var(--primary);
      font-size: 1.45rem;
    }

    /* Pagamento */
    .payment-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .payment-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .payment-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .payment-btn {
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .payment-btn.active {
      border-color: var(--primary);
      background: #f0fdf4;
      color: var(--primary-dark);
      font-weight: 700;
      box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.2);
    }

    .cash-calculator {
      background: #f8fafc;
      border: 1px solid var(--border);
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .cash-input-group {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
    }

    .cash-input-group input {
      width: 90px;
      padding: 6px 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-weight: 700;
    }

    .troco-display {
      font-size: 0.95rem;
    }

    .troco-positivo { color: var(--primary); }
    .troco-insuficiente { color: #ef4444; }

    .pix-box {
      background: #f0fdf4;
      border: 1px dashed var(--primary);
      padding: 10px;
      border-radius: var(--radius-sm);
      text-align: center;
      font-size: 0.82rem;
    }

    .pix-badge {
      font-weight: 800;
      color: var(--primary-dark);
    }

    .pix-code {
      font-family: monospace;
      color: var(--text-main);
      margin: 4px 0;
    }

    .pix-hint {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .btn-checkout {
      width: 100%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: #ffffff;
      padding: 14px;
      border-radius: var(--radius-sm);
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(21, 128, 61, 0.3);
      cursor: pointer;
    }

    .btn-checkout:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
      transform: translateY(-1px);
    }

    .btn-checkout:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Base de Modais (Recibo, Abertura e Fechamento de Caixa) */
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
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .modal-lg {
      max-width: 640px;
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
      width: 100%;
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
      margin-top: 4px;
    }

    /* Modal de Recibo Não Fiscal */
    .receipt-box {
      max-width: 440px;
      background: #ffffff;
      padding: 24px;
    }

    .receipt-paper {
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.85rem;
      line-height: 1.4;
      color: #111827;
      background: #fff;
    }

    .receipt-header {
      text-align: center;
    }

    .receipt-logo {
      height: 48px;
      margin-bottom: 6px;
    }

    .receipt-company {
      font-size: 1.1rem;
      font-weight: 900;
    }

    .receipt-voucher-title {
      font-size: 0.95rem;
      font-weight: 800;
      margin: 4px 0;
    }

    .receipt-divider {
      letter-spacing: -1px;
      margin: 4px 0;
    }

    .receipt-items {
      margin: 8px 0;
    }

    .receipt-item-header {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      border-bottom: 1px dashed #000;
      padding-bottom: 4px;
      margin-bottom: 4px;
    }

    .receipt-item-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .receipt-totals {
      margin-top: 8px;
    }

    .r-tot-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .r-grand-total {
      font-weight: 900;
      font-size: 1rem;
    }

    .receipt-footer {
      text-align: center;
      margin-top: 12px;
      font-size: 0.8rem;
    }

    .receipt-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    .receipt-actions button {
      flex: 1;
      justify-content: center;
    }

    /* Responsivo: tablets */
    @media (max-width: 1024px) {
      .pdv-container {
        padding: 20px 16px;
        gap: 16px;
      }

      .product-grid {
        max-height: none;
      }
    }

    /* Responsivo: celulares */
    @media (max-width: 640px) {
      .pdv-title {
        font-size: 1.25rem;
      }

      .pdv-topbar {
        gap: 10px;
      }

      .pdv-quick-stats {
        width: 100%;
      }

      .stat-pill {
        flex: 1;
        justify-content: center;
      }

      .btn-caixa-action {
        flex: 1 0 100%;
        justify-content: center;
      }

      .caixa-fechado-banner {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
      }

      .product-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 10px;
      }

      .product-name {
        font-size: 0.85rem;
        min-height: 34px;
      }

      .payment-options {
        grid-template-columns: 1fr 1fr;
      }

      .despesa-form {
        grid-template-columns: 1fr;
      }

      .fechamento-resumo-grid {
        grid-template-columns: 1fr;
      }

      .modal-lg {
        max-width: 100%;
      }
    }
  `]
})
export class PdvComponent implements OnInit, OnDestroy {
  produtoService = inject(ProdutoService);
  vendaService = inject(VendaService);
  caixaService = inject(CaixaService);
  clienteService = inject(ClienteService);
  authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('scannerVideo') scannerVideoRef?: ElementRef<HTMLVideoElement>;

  // Expostos para uso direto no template (funções puras importadas de core/models)
  readonly isVendidoPorPeso = isVendidoPorPeso;
  readonly quantidadeEstoqueParaGramas = quantidadeEstoqueParaGramas;
  readonly PASSO_GRAMAS = PASSO_GRAMAS;

  produtos: Produto[] = [];
  produtosFiltrados: Produto[] = [];
  categorias: string[] = [];

  termoBusca = '';
  categoriaAtiva = '';

  // Carrinho
  carrinho: ItemCarrinho[] = [];
  desconto = 0;
  subtotal = 0;
  totalPagar = 0;

  // Cliente vinculado à venda (opcional)
  clientes = this.clienteService.clientes;
  clienteSelecionadoId: number | '' = '';

  // Pagamento
  formaPagamento: FormaPagamento = 'PIX';
  valorRecebidoDinheiro = 0;
  troco = 0;

  finalizando = false;
  modalReciboAberto = false;
  vendaEmitida: VendaResponse | null = null;

  // Caixa
  modalAbrirCaixaAberto = false;
  valorAberturaInput = 100;

  modalFecharCaixaAberto = false;
  despesaDescricao = '';
  despesaCategoria: DespesaCaixa['categoria'] = 'OUTROS';
  despesaValor = 0;
  valorContadoInput = 0;
  observacoesFechamento = '';
  caixaFechadoResumo: Caixa | null = null;

  // Scanner de câmera (produto normal ou etiqueta de balança)
  modalScannerAberto = false;
  scannerErro = '';
  leituraBalancaPendente: LeituraBalanca | null = null;
  private codeReader = new BrowserMultiFormatReader(this.criarHintsScanner());
  private scannerControls?: IScannerControls;
  private processandoCodigoEscaneado = false;

  get caixaAberto(): boolean {
    return this.caixaService.aberto;
  }

  ngOnInit(): void {
    this.carregarProdutos();
    this.carregarCategorias();

    // Sempre revalida o estado real do caixa no backend antes de decidir se
    // pede abertura: usar o valor em cache (`caixaService.aberto`) direto aqui
    // pode ver um falso "fechado" se essa checagem ainda não tiver retornado,
    // levando a abrir o modal e depois falhar com "já existe um caixa aberto".
    this.caixaService.recarregar().subscribe(() => {
      if (!this.caixaAberto) {
        this.abrirModalAbrirCaixa();
      }
      this.cdr.detectChanges();
    });
  }

  // ==================== CAIXA: ABERTURA ====================

  abrirModalAbrirCaixa(): void {
    this.valorAberturaInput = 100;
    this.modalAbrirCaixaAberto = true;
  }

  confirmarAberturaCaixa(): void {
    if (this.valorAberturaInput < 0) return;
    const operador = this.authService.currentUser()?.nome || 'Operador';
    this.caixaService.abrirCaixa(this.valorAberturaInput, operador).subscribe({
      next: () => {
        this.modalAbrirCaixaAberto = false;
        this.cdr.detectChanges();
      },
      error: (err) => alert(err?.error?.message || 'Erro ao abrir o caixa.')
    });
  }

  // ==================== CAIXA: DESPESAS ====================

  adicionarDespesaCaixa(): void {
    if (!this.despesaDescricao.trim() || this.despesaValor <= 0) return;
    this.caixaService.adicionarDespesa(this.despesaDescricao.trim(), this.despesaValor, this.despesaCategoria).subscribe({
      next: () => {
        this.despesaDescricao = '';
        this.despesaValor = 0;
        this.despesaCategoria = 'OUTROS';
        this.cdr.detectChanges();
      },
      error: (err) => alert(err?.error?.message || 'Erro ao lançar despesa.')
    });
  }

  removerDespesaCaixa(id: number): void {
    this.caixaService.removerDespesa(id).subscribe({
      next: () => this.cdr.detectChanges(),
      error: (err) => alert(err?.error?.message || 'Erro ao remover despesa.')
    });
  }

  // ==================== CAIXA: FECHAMENTO ====================

  abrirModalFecharCaixa(): void {
    this.valorContadoInput = Math.max(this.caixaService.saldoEsperadoDinheiro, 0);
    this.observacoesFechamento = '';
    this.modalFecharCaixaAberto = true;
  }

  diferencaFechamento(): number {
    return (this.valorContadoInput || 0) - this.caixaService.saldoEsperadoDinheiro;
  }

  confirmarFechamentoCaixa(): void {
    this.caixaService.fecharCaixa(this.valorContadoInput || 0, this.observacoesFechamento).subscribe({
      next: (fechado) => {
        this.modalFecharCaixaAberto = false;
        this.caixaFechadoResumo = fechado;
        this.cdr.detectChanges();
      },
      error: (err) => alert(err?.error?.message || 'Erro ao fechar o caixa.')
    });
  }

  totalVendasResumo(caixa: Caixa): number {
    return caixa.vendasDinheiro + caixa.vendasPix + caixa.vendasCartaoCredito + caixa.vendasCartaoDebito;
  }

  totalDespesasResumo(caixa: Caixa): number {
    return caixa.totalDespesas;
  }

  carregarProdutos(): void {
    this.produtoService.getProdutos().subscribe({
      next: (res) => {
        this.produtos = res;
        this.filtrarCatalogo();
        this.cdr.detectChanges();
      }
    });
  }

  carregarCategorias(): void {
    this.produtoService.getCategorias().subscribe({
      next: (res) => {
        this.categorias = res;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.pararCamera();
  }

  // ==================== SCANNER DE CÂMERA ====================

  private criarHintsScanner(): Map<DecodeHintType, unknown> {
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE
    ]);
    return hints;
  }

  abrirScanner(): void {
    if (!this.caixaAberto) {
      alert('O caixa está fechado. Abra o caixa antes de vender.');
      return;
    }
    this.scannerErro = '';
    this.modalScannerAberto = true;
    // aguarda o *ngIf renderizar o elemento <video> antes de iniciar a câmera
    setTimeout(() => this.iniciarCamera(), 0);
  }

  fecharScanner(): void {
    this.pararCamera();
    this.modalScannerAberto = false;
  }

  private async iniciarCamera(): Promise<void> {
    if (!this.scannerVideoRef) return;
    try {
      this.scannerControls = await this.codeReader.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        this.scannerVideoRef.nativeElement,
        (result) => {
          if (result) {
            this.processarCodigoEscaneado(result.getText());
          }
          // erros de "nenhum código encontrado neste frame" acontecem a cada frame sem leitura e são esperados
        }
      );
    } catch {
      this.scannerErro = 'Não foi possível acessar a câmera. Verifique se o navegador tem permissão de câmera para este site.';
      this.cdr.detectChanges();
    }
  }

  private pararCamera(): void {
    this.scannerControls?.stop();
    this.scannerControls = undefined;
  }

  private processarCodigoEscaneado(codigo: string): void {
    if (this.processandoCodigoEscaneado) return;
    this.processandoCodigoEscaneado = true;
    this.pararCamera();
    this.modalScannerAberto = false;

    if (PADRAO_CODIGO_BALANCA.test(codigo)) {
      this.produtoService.lerCodigoBalanca(codigo).subscribe({
        next: (leitura) => {
          this.leituraBalancaPendente = leitura;
          this.processandoCodigoEscaneado = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.processandoCodigoEscaneado = false;
          alert(err?.error?.message || 'Não foi possível interpretar o código da etiqueta da balança. Tente escanear novamente.');
          this.cdr.detectChanges();
        }
      });
      return;
    }

    const produto = this.produtos.find(p => p.codigoBarras === codigo);
    if (produto) {
      this.adicionarAoCarrinho(produto);
    } else {
      alert(`Nenhum produto encontrado com o código de barras "${codigo}".`);
    }
    this.processandoCodigoEscaneado = false;
    this.cdr.detectChanges();
  }

  confirmarLeituraBalanca(): void {
    if (!this.leituraBalancaPendente) return;
    const leitura = this.leituraBalancaPendente;
    const produto = this.produtos.find(p => p.id === leitura.produtoId);

    if (!produto) {
      alert('Este produto não foi encontrado no catálogo carregado. Atualize a página e tente novamente.');
      this.leituraBalancaPendente = null;
      return;
    }

    this.carrinho.push({
      produto,
      quantidade: leitura.pesoCalculado,
      precoUnitario: leitura.precoVenda,
      subtotal: Math.round(leitura.pesoCalculado * leitura.precoVenda * 100) / 100
    });

    this.calcularTotais();
    this.leituraBalancaPendente = null;
  }

  cancelarLeituraBalanca(): void {
    this.leituraBalancaPendente = null;
  }

  filtrarCatalogo(): void {
    const termo = this.termoBusca.toLowerCase().trim();

    this.produtosFiltrados = this.produtos.filter(p => {
      const matchTexto = !termo ||
        p.nome.toLowerCase().includes(termo) ||
        (p.codigoBarras && p.codigoBarras.toLowerCase().includes(termo));

      const matchCat = !this.categoriaAtiva || p.categoria === this.categoriaAtiva;

      return matchTexto && matchCat;
    });
  }

  adicionarPrimeiroResultado(): void {
    if (this.produtosFiltrados.length > 0) {
      this.adicionarAoCarrinho(this.produtosFiltrados[0]);
      this.termoBusca = '';
      this.filtrarCatalogo();
    }
  }

  adicionarAoCarrinho(p: Produto): void {
    if (p.estoqueAtual <= 0) return;

    const idxExistente = this.carrinho.findIndex(it => it.produto.id === p.id);

    if (isVendidoPorPeso(p)) {
      if (idxExistente >= 0) {
        // produto pesável já está no carrinho: soma mais um incremento padrão em gramas
        this.incrementarGramas(idxExistente, GRAMAS_INICIAIS);
        return;
      }
      const qtdInicial = Math.min(gramasParaQuantidadeEstoque(p, GRAMAS_INICIAIS), p.estoqueAtual);
      this.carrinho.push({
        produto: p,
        quantidade: qtdInicial,
        precoUnitario: p.precoVenda,
        subtotal: Math.round(qtdInicial * p.precoVenda * 100) / 100
      });
      this.calcularTotais();
      return;
    }

    if (idxExistente >= 0) {
      const itemExistente = this.carrinho[idxExistente];
      if (itemExistente.quantidade < p.estoqueAtual) {
        itemExistente.quantidade += 1;
        itemExistente.subtotal = itemExistente.quantidade * itemExistente.precoUnitario;
      }
    } else {
      this.carrinho.push({
        produto: p,
        quantidade: 1,
        precoUnitario: p.precoVenda,
        subtotal: p.precoVenda
      });
    }

    this.calcularTotais();
  }

  alterarQuantidade(idx: number, delta: number): void {
    const item = this.carrinho[idx];
    const novaQtd = item.quantidade + delta;

    if (novaQtd <= 0) {
      this.removerItem(idx);
    } else if (novaQtd <= item.produto.estoqueAtual) {
      item.quantidade = novaQtd;
      item.subtotal = item.quantidade * item.precoUnitario;
      this.calcularTotais();
    }
  }

  // ==================== ITENS VENDIDOS POR PESO (KG/G) ====================

  /** Peso do item em gramas, para exibição/edição no carrinho (a quantidade
   *  interna do item continua na unidade de estoque do produto: KG ou G). */
  gramasDoItem(item: ItemCarrinho): number {
    return Math.round(quantidadeEstoqueParaGramas(item.produto, item.quantidade));
  }

  /** Define o peso do item a partir de um valor em gramas digitado pelo operador,
   *  convertendo para a unidade de estoque do produto e recalculando o subtotal. */
  definirGramasDoItem(idx: number, gramas: number): void {
    const item = this.carrinho[idx];
    if (!item) return;

    const gramasValidas = Math.max(0, Number(gramas) || 0);
    if (gramasValidas === 0) {
      this.removerItem(idx);
      return;
    }

    const estoqueEmGramas = quantidadeEstoqueParaGramas(item.produto, item.produto.estoqueAtual);
    const gramasFinais = Math.min(gramasValidas, estoqueEmGramas);

    item.quantidade = gramasParaQuantidadeEstoque(item.produto, gramasFinais);
    item.subtotal = Math.round(item.quantidade * item.precoUnitario * 100) / 100;
    this.calcularTotais();
  }

  incrementarGramas(idx: number, deltaGramas: number): void {
    const item = this.carrinho[idx];
    if (!item) return;
    this.definirGramasDoItem(idx, this.gramasDoItem(item) + deltaGramas);
  }

  removerItem(idx: number): void {
    this.carrinho.splice(idx, 1);
    this.calcularTotais();
  }

  limparCarrinho(): void {
    this.carrinho = [];
    this.desconto = 0;
    this.calcularTotais();
  }

  calcularTotais(): void {
    this.subtotal = this.carrinho.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalPagar = Math.max(this.subtotal - (this.desconto || 0), 0);

    if (this.valorRecebidoDinheiro < this.totalPagar) {
      this.valorRecebidoDinheiro = Math.ceil(this.totalPagar);
    }
    this.calcularTroco();
  }

  calcularTroco(): void {
    this.troco = (this.valorRecebidoDinheiro || 0) - this.totalPagar;
  }

  finalizarVenda(): void {
    if (this.carrinho.length === 0) return;
    if (!this.caixaAberto) {
      alert('O caixa está fechado. Abra o caixa antes de finalizar vendas.');
      return;
    }

    this.finalizando = true;

    const request: VendaRequest = {
      formaPagamento: this.formaPagamento,
      desconto: this.desconto,
      valorRecebido: this.formaPagamento === 'DINHEIRO' ? this.valorRecebidoDinheiro : this.totalPagar,
      clienteId: this.clienteSelecionadoId || undefined,
      itens: this.carrinho.map(it => ({
        produtoId: it.produto.id!,
        quantidade: it.quantidade,
        precoUnitario: it.precoUnitario
      }))
    };

    this.vendaService.finalizarVenda(request).subscribe({
      next: (res) => {
        this.finalizando = false;
        this.vendaEmitida = res;
        this.modalReciboAberto = true;

        // O backend já atualizou o caixa e o histórico do cliente durante a venda;
        // aqui só sincronizamos o estado em memória do frontend.
        this.caixaService.sincronizarAposVenda();
        if (this.clienteSelecionadoId) {
          this.clienteService.sincronizarAposCompra();
        }

        // Limpar carrinho e atualizar produtos
        this.carrinho = [];
        this.desconto = 0;
        this.clienteSelecionadoId = '';
        this.calcularTotais();
        this.cdr.detectChanges();
        this.carregarProdutos();
      },
      error: (err) => {
        this.finalizando = false;
        this.cdr.detectChanges();
        alert(err?.error?.message || 'Erro ao processar venda no caixa.');
      }
    });
  }

  imprimirCupom(): void {
    window.print();
  }
}
