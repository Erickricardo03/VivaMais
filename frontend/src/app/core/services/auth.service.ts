import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginResponse } from '../models/models';
import { apiBaseUrl } from '../api-url';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${apiBaseUrl()}/auth`;
  private tokenKey = 'vivamais_token';
  private userKey = 'vivamais_user';

  currentUser = signal<{ username: string; nome: string; cargo: string } | null>(this.getStoredUser());
  isAuthenticated = signal<boolean>(!!this.getStoredToken());

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(res => {
        if (res.authenticated && res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          const user = {
            username: res.username || username,
            nome: res.nome || 'Administrador',
            cargo: res.cargo || 'Gerente'
          };
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  private getStoredUser(): { username: string; nome: string; cargo: string } | null {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem(this.userKey);
      if (u) {
        try {
          return JSON.parse(u);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
