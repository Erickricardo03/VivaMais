import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

// Cada rota carrega seu componente sob demanda (code-splitting por rota),
// em vez de empacotar todas as telas no bundle inicial. Isso reduz bastante
// o JS baixado no primeiro acesso — essencial para conexões lentas, já que
// o visitante só paga o custo da tela que realmente vai usar.
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'estoque',
    loadComponent: () => import('./features/estoque/estoque.component').then(m => m.EstoqueComponent),
    canActivate: [authGuard]
  },
  {
    path: 'pdv',
    loadComponent: () => import('./features/pdv/pdv.component').then(m => m.PdvComponent),
    canActivate: [authGuard]
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./features/relatorios/relatorios.component').then(m => m.RelatoriosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'clientes',
    loadComponent: () => import('./features/clientes/clientes.component').then(m => m.ClientesComponent),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
