import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { ClienteService } from '../../core/services/cliente.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar-header">
      <div class="navbar-container">
        <!-- Logo e Marca -->
        <div class="brand-container" routerLink="/dashboard">
          <div class="logo-wrapper">
            <img src="/logo.svg" alt="VivaMais Logo" class="brand-logo" />
          </div>
          <div class="brand-text">
            <span class="brand-title">VivaMais</span>
            <span class="brand-subtitle">PRODUTOS NATURAIS</span>
          </div>
        </div>

        <!-- Links de Navegação -->
        <nav class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span>Dashboard</span>
          </a>

          <a routerLink="/estoque" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <span>Estoque & Alertas</span>
            <span *ngIf="totalAlertas > 0" class="nav-alert-badge" title="{{ totalAlertas }} alertas de validade ou estoque baixo">
              {{ totalAlertas }}
            </span>
          </a>

          <a routerLink="/pdv" routerLinkActive="active" class="nav-item nav-item-pdv">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>PDV (Caixa)</span>
          </a>

          <a routerLink="/relatorios" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <span>Faturamento</span>
          </a>

          <a routerLink="/clientes" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"/>
            </svg>
            <span>Clientes</span>
            <span *ngIf="totalClientesSumidos > 0" class="nav-alert-badge" title="{{ totalClientesSumidos }} clientes sem comprar há mais de 30 dias">
              {{ totalClientesSumidos }}
            </span>
          </a>
        </nav>

        <!-- Informações do Usuário & Sair (visível em telas maiores) -->
        <div class="user-actions">
          <div class="user-badge">
            <div class="user-avatar">
              <span>{{ userInitial }}</span>
            </div>
            <div class="user-details">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ userRole }}</span>
            </div>
          </div>
          <button (click)="logout()" class="btn-logout" title="Encerrar Sessão">
            <svg class="logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span class="logout-text">Sair</span>
          </button>
        </div>

        <!-- Botão Hambúrguer (visível apenas em mobile/tablet) -->
        <button
          class="btn-hamburger"
          [class.active]="menuAberto"
          (click)="menuAberto = !menuAberto"
          [attr.aria-expanded]="menuAberto"
          aria-label="Abrir menu de navegação">
          <span></span><span></span><span></span>
        </button>
      </div>

      <!-- Menu Mobile (dropdown) -->
      <div class="mobile-menu" [class.open]="menuAberto">
        <nav class="mobile-nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="mobile-nav-item" (click)="fecharMenu()">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span>Dashboard</span>
          </a>

          <a routerLink="/estoque" routerLinkActive="active" class="mobile-nav-item" (click)="fecharMenu()">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <span>Estoque & Alertas</span>
            <span *ngIf="totalAlertas > 0" class="nav-alert-badge">{{ totalAlertas }}</span>
          </a>

          <a routerLink="/pdv" routerLinkActive="active" class="mobile-nav-item mobile-nav-item-pdv" (click)="fecharMenu()">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>PDV (Caixa)</span>
          </a>

          <a routerLink="/relatorios" routerLinkActive="active" class="mobile-nav-item" (click)="fecharMenu()">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <span>Faturamento</span>
          </a>

          <a routerLink="/clientes" routerLinkActive="active" class="mobile-nav-item" (click)="fecharMenu()">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"/>
            </svg>
            <span>Clientes</span>
            <span *ngIf="totalClientesSumidos > 0" class="nav-alert-badge">{{ totalClientesSumidos }}</span>
          </a>
        </nav>

        <div class="mobile-user-row">
          <div class="user-badge">
            <div class="user-avatar"><span>{{ userInitial }}</span></div>
            <div class="user-details">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ userRole }}</span>
            </div>
          </div>
          <button (click)="logout()" class="btn-logout" title="Encerrar Sessão">
            <svg class="logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Backdrop para fechar o menu mobile ao tocar fora -->
    <div class="mobile-menu-backdrop" *ngIf="menuAberto" (click)="fecharMenu()"></div>
  `,
  styles: [`
    .navbar-header {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      height: 72px;
      box-sizing: border-box;
    }
    .navbar-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 24px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-container {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      text-decoration: none;
    }
    .logo-wrapper {
      height: 48px;
      width: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-logo {
      height: 44px;
      width: auto;
      max-width: 48px;
      object-fit: contain;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--primary);
      line-height: 1.1;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 2.5px;
      color: var(--accent-gold);
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.95rem;
      transition: color 0.15s ease, background-color 0.15s ease;
      position: relative;
      border-bottom: 2px solid transparent;
      box-sizing: border-box;
    }
    .nav-item:hover {
      color: var(--primary);
      background-color: var(--primary-soft);
    }
    .nav-item.active {
      color: var(--primary);
      background-color: var(--primary-soft);
      border-bottom: 2px solid var(--primary);
    }
    .nav-item-pdv {
      background: linear-gradient(135deg, rgba(21, 128, 61, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%);
      color: var(--primary-dark);
      border: 1px solid rgba(21, 128, 61, 0.2);
    }
    .nav-item-pdv:hover, .nav-item-pdv.active {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: #ffffff;
      border-color: transparent;
    }
    .nav-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .nav-alert-badge {
      background-color: #ef4444;
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 9999px;
      margin-left: 2px;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
    }
    .user-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg-surface);
      padding: 6px 12px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border);
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent-gold) 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .user-details {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .user-role {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .btn-logout {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      color: #ef4444;
      background: #fef2f2;
      border: 1px solid #fecaca;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .btn-logout:hover {
      background: #fee2e2;
      color: #dc2626;
    }
    .logout-icon {
      width: 16px;
      height: 16px;
    }

    /* Botão Hambúrguer */
    .btn-hamburger {
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 5px;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }

    .btn-hamburger:hover {
      background-color: var(--bg-surface);
    }

    .btn-hamburger span {
      display: block;
      width: 22px;
      height: 2px;
      background: var(--text-main);
      border-radius: 2px;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .btn-hamburger.active span:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }
    .btn-hamburger.active span:nth-child(2) {
      opacity: 0;
    }
    .btn-hamburger.active span:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }

    /* Menu Mobile (dropdown abaixo da navbar) */
    .mobile-menu {
      display: none;
      flex-direction: column;
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      box-shadow: var(--shadow-md);
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.25s ease;
    }

    .mobile-menu.open {
      max-height: 80vh;
      overflow-y: auto;
    }

    .mobile-nav-links {
      display: flex;
      flex-direction: column;
      padding: 8px 16px;
      gap: 4px;
    }

    .mobile-nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.95rem;
    }

    .mobile-nav-item:active {
      background-color: var(--primary-soft);
    }

    .mobile-nav-item.active {
      color: var(--primary);
      background-color: var(--primary-soft);
    }

    .mobile-nav-item-pdv {
      background: linear-gradient(135deg, rgba(21, 128, 61, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%);
      color: var(--primary-dark);
    }

    .mobile-user-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-top: 1px solid var(--border);
    }

    .mobile-menu-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.35);
      z-index: 999;
    }

    /* Breakpoint: tablets e celulares */
    @media (max-width: 900px) {
      .nav-links {
        display: none;
      }

      .user-actions .user-badge,
      .user-actions .btn-logout {
        display: none;
      }

      .btn-hamburger {
        display: flex;
      }

      .mobile-menu {
        display: flex;
      }

      .navbar-container {
        padding: 0 16px;
      }

      .brand-title {
        font-size: 1.25rem;
      }

      .brand-subtitle {
        font-size: 0.58rem;
        letter-spacing: 2px;
      }
    }

    @media (max-width: 480px) {
      .logo-wrapper {
        height: 38px;
        width: 38px;
      }

      .brand-logo {
        height: 34px;
      }
    }
  `]
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  dashboardService = inject(DashboardService);
  clienteService = inject(ClienteService);
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  totalAlertas = 0;
  menuAberto = false;

  fecharMenu(): void {
    this.menuAberto = false;
  }

  get totalClientesSumidos(): number {
    return this.clienteService.clientes().filter(c => this.clienteService.diasSemComprar(c) >= 30).length;
  }

  get userName(): string {
    return this.authService.currentUser()?.nome || 'Administrador';
  }

  get userRole(): string {
    return this.authService.currentUser()?.cargo || 'Gerente Geral';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  ngOnInit(): void {
    this.carregarAlertas();
  }

  carregarAlertas(): void {
    this.dashboardService.getResumo().subscribe({
      next: (res) => {
        this.totalAlertas = (res.produtosEstoqueBaixoCount || 0) +
                            (res.produtosVencendoCount || 0) +
                            (res.produtosVencidosCount || 0);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
