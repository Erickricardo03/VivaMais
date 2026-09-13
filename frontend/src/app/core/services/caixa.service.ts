import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Caixa, CategoriaDespesa } from '../models/models';
import { apiBaseUrl } from '../api-url';

@Injectable({
  providedIn: 'root'
})
export class CaixaService {
  private apiUrl = `${apiBaseUrl()}/caixa`;

  caixaAtual = signal<Caixa | null>(null);

  constructor(private http: HttpClient) {
    this.carregarCaixaAtual();
  }

  get aberto(): boolean {
    return this.caixaAtual()?.status === 'ABERTO';
  }

  get totalDespesas(): number {
    return this.caixaAtual()?.totalDespesas || 0;
  }

  get saldoEsperadoDinheiro(): number {
    return this.caixaAtual()?.saldoEsperadoDinheiro || 0;
  }

  carregarCaixaAtual(): void {
    this.http.get<Caixa | null>(`${this.apiUrl}/atual`).subscribe({
      next: (caixa) => this.caixaAtual.set(caixa),
      error: () => this.caixaAtual.set(null)
    });
  }

  abrirCaixa(valorAbertura: number, operador: string): Observable<Caixa> {
    return this.http.post<Caixa>(`${this.apiUrl}/abrir`, { valorAbertura, operador }).pipe(
      tap(caixa => this.caixaAtual.set(caixa))
    );
  }

  adicionarDespesa(descricao: string, valor: number, categoria: CategoriaDespesa): Observable<Caixa> {
    return this.http.post<Caixa>(`${this.apiUrl}/despesas`, { descricao, valor, categoria }).pipe(
      tap(caixa => this.caixaAtual.set(caixa))
    );
  }

  removerDespesa(id: number): Observable<Caixa> {
    return this.http.delete<Caixa>(`${this.apiUrl}/despesas/${id}`).pipe(
      tap(caixa => this.caixaAtual.set(caixa))
    );
  }

  fecharCaixa(valorContado: number, observacoes: string): Observable<Caixa> {
    return this.http.post<Caixa>(`${this.apiUrl}/fechar`, { valorContado, observacoes }).pipe(
      tap(() => this.caixaAtual.set(null))
    );
  }

  getHistorico(): Observable<Caixa[]> {
    return this.http.get<Caixa[]>(`${this.apiUrl}/historico`);
  }

  /** Atualiza o caixa em memória após uma venda ser registrada no backend. */
  sincronizarAposVenda(): void {
    this.carregarCaixaAtual();
  }
}
