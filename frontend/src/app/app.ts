import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { SideAmbientComponent } from './shared/side-ambient/side-ambient.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SideAmbientComponent],
  template: `
    <ng-container *ngIf="showNavbar()">
      <app-side-ambient side="left"></app-side-ambient>
      <app-side-ambient side="right"></app-side-ambient>
    </ng-container>
    <app-navbar *ngIf="showNavbar()"></app-navbar>
    <main [class.has-navbar]="showNavbar()">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    main.has-navbar {
      min-height: calc(100vh - 72px);
    }
  `]
})
export class App {
  authService = inject(AuthService);
  router = inject(Router);
  currentUrl = '';

  constructor() {
    this.currentUrl = this.router.url;
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      this.currentUrl = e.urlAfterRedirects || e.url;
    });
  }

  showNavbar(): boolean {
    return this.authService.isAuthenticated() && !this.currentUrl.includes('/login');
  }
}
