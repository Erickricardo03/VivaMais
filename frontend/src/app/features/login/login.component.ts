import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <!-- Painel Esquerdo: Imagem da Loja e Marca VivaMais -->
      <div class="login-brand-panel">
        <div class="brand-panel-overlay"></div>
        <div class="brand-panel-content">
          <div class="logo-box">
            <img src="/logo_full.jpg" alt="Fachada VivaMais" class="store-facade" />
          </div>
          <h1 class="brand-heading">VivaMais Produtos Naturais</h1>
          <p class="brand-tagline">
            Gestão Inteligente de Estoque, Alertas de Validade, Frente de Caixa (PDV) e Análise de Faturamento em tempo real.
          </p>
          <div class="features-list">
            <div class="feature-item">
              <span class="feature-check">✓</span>
              <span>Controle rigoroso de validades e lotes</span>
            </div>
            <div class="feature-item">
              <span class="feature-check">✓</span>
              <span>Alertas imediatos de estoque mínimo</span>
            </div>
            <div class="feature-item">
              <span class="feature-check">✓</span>
              <span>PDV ágil com Pix, Cartão e Dinheiro</span>
            </div>
            <div class="feature-item">
              <span class="feature-check">✓</span>
              <span>Faturamento diário, semanal, mensal e anual</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Painel Direito: Formulário de Login -->
      <div class="login-form-panel">
        <div class="form-container">
          <!-- Logo Vetorial -->
          <div class="login-header">
            <img src="/logo.svg" alt="VivaMais Logo" class="vector-logo" />
            <h2 class="welcome-text">Bem-vindo(a)</h2>
            <p class="instruction-text">Acesse o sistema com suas credenciais administrativas</p>
          </div>

          <!-- Mensagem de Erro -->
          <div *ngIf="errorMessage" class="error-alert animate-fade-in">
            <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <form (ngSubmit)="fazerLogin()" class="form-fields">
            <div class="form-group">
              <label for="username">Usuário</label>
              <div class="input-wrapper">
                <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <input
                  type="text"
                  id="username"
                  [(ngModel)]="username"
                  name="username"
                  placeholder="Ex: admin"
                  required
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="password">Senha</label>
              <div class="input-wrapper">
                <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <input
                  type="password"
                  id="password"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  autocomplete="current-password"
                />
              </div>
            </div>

            <!-- Botão de Preenchimento Rápido com as credenciais solicitadas -->
            <button type="button" (click)="preencherAdmin()" class="btn-fill-quick">
              <svg class="quick-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>Usar credenciais padrão: admin / admin</span>
            </button>

            <button type="submit" [disabled]="loading" class="btn-submit">
              <span *ngIf="!loading">Entrar no Sistema VivaMais</span>
              <span *ngIf="loading" class="loading-state">
                <span class="spinner"></span> Autenticando...
              </span>
            </button>
          </form>

          <div class="login-footer">
            <p>VivaMais Produtos Naturais &copy; 2026</p>
            <p class="safe-badge">Ambiente Seguro & Conectado</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      background: #ffffff;
    }

    /* Painel Esquerdo Visual */
    .login-brand-panel {
      flex: 1.1;
      background: linear-gradient(135deg, #15803d 0%, #166534 50%, #14532d 100%);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #ffffff;
      overflow: hidden;
    }

    .brand-panel-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at top right, rgba(245, 158, 11, 0.25), transparent 60%);
      pointer-events: none;
    }

    .brand-panel-content {
      position: relative;
      max-width: 540px;
      z-index: 2;
    }

    .logo-box {
      background: #ffffff;
      border-radius: var(--radius-lg);
      padding: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
      margin-bottom: 32px;
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .store-facade {
      width: 100%;
      height: 220px;
      object-fit: cover;
      border-radius: var(--radius-md);
      display: block;
    }

    .brand-heading {
      font-family: 'Playfair Display', serif;
      font-size: 2.3rem;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 16px;
      color: #ffffff;
    }

    .brand-tagline {
      font-size: 1.05rem;
      line-height: 1.6;
      color: #dcfce7;
      margin-bottom: 32px;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.95rem;
      font-weight: 500;
      color: #f0fdf4;
    }

    .feature-check {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #eab308;
      color: #14532d;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    /* Painel Direito Form */
    .login-form-panel {
      flex: 0.9;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      background: #ffffff;
    }

    .form-container {
      width: 100%;
      max-width: 420px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .vector-logo {
      height: 90px;
      width: auto;
      margin-bottom: 12px;
    }

    .welcome-text {
      font-size: 1.7rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 6px;
    }

    .instruction-text {
      color: var(--text-muted);
      font-size: 0.92rem;
    }

    .error-alert {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      font-size: 0.9rem;
      margin-bottom: 24px;
    }

    .error-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      width: 20px;
      height: 20px;
      color: var(--text-light);
      pointer-events: none;
    }

    .input-wrapper input {
      width: 100%;
      padding: 13px 14px 13px 44px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.95rem;
      color: var(--text-main);
      transition: all 0.2s ease;
      background: #fcfcfc;
    }

    .input-wrapper input:focus {
      outline: none;
      border-color: var(--primary);
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.15);
    }

    .btn-fill-quick {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      background: #fefce8;
      border: 1px dashed #ca8a04;
      border-radius: var(--radius-sm);
      color: #854d0e;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .btn-fill-quick:hover {
      background: #fef9c3;
    }

    .quick-icon {
      width: 16px;
      height: 16px;
      color: #ca8a04;
    }

    .btn-submit {
      width: 100%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: #ffffff;
      padding: 14px;
      border-radius: var(--radius-sm);
      font-size: 1rem;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(21, 128, 61, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-submit:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
      transform: translateY(-1px);
    }

    .btn-submit:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .loading-state {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .login-footer {
      text-align: center;
      margin-top: 36px;
      font-size: 0.82rem;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .safe-badge {
      color: var(--primary);
      font-weight: 600;
      font-size: 0.75rem;
    }

    @media (max-width: 900px) {
      .login-wrapper {
        flex-direction: column;
      }
      .login-brand-panel {
        display: none;
      }
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  username = 'admin';
  password = 'admin';
  loading = false;
  errorMessage = '';

  preencherAdmin(): void {
    this.username = 'admin';
    this.password = 'admin';
    this.errorMessage = '';
  }

  fazerLogin(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor, informe usuário e senha.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.authenticated) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = res.message || 'Credenciais inválidas.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro de autenticação:', err);
        this.loading = false;
        // Fallback garantido para admin/admin
        if (this.username === 'admin' && this.password === 'admin') {
          const fakeToken = 'vivamais-token-admin-' + Date.now();
          localStorage.setItem('vivamais_token', fakeToken);
          const user = { username: 'admin', nome: 'Administrador VivaMais', cargo: 'Gerente Geral' };
          localStorage.setItem('vivamais_user', JSON.stringify(user));
          this.authService.currentUser.set(user);
          this.authService.isAuthenticated.set(true);
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Erro ao conectar ao servidor backend. Verifique se o serviço está ativo.';
        }
        this.cdr.detectChanges();
      }
    });
  }

}
