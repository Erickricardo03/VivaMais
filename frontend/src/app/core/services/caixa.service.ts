import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { Caixa, CategoriaDespesa } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CaixaService {
  private apiUrl = `${environment.apiUrl}/caixa`;

  caixaAtual = signal<Caixa | null>(null);

  /** true assim que a primeira consulta ao estado real do caixa (sucesso ou erro)
   *  retornar do backend. Enquanto for false, `caixaAtual` ainda não reflete o
   *  estado real e não deve ser usado para decidir se o modal de abertura aparece
   *  (evita o falso "Fechado" que aparecia antes da primeira resposta chegar). */
  carregado = signal(false);

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
    this.recarregar().subscribe();
  }

  /** Busca o estado real do caixa no backend agora (não usa cache) e retorna um
   *  Observable que emite assim que `caixaAtual`/`carregado` já estão atualizados —
   *  use antes de decidir mostrar o modal de abertura de caixa, para não confiar
   *  em um estado ainda não carregado. */
  recarregar(): Observable<Caixa | null> {
    return this.http.get<Caixa | null>(`${this.apiUrl}/atual`).pipe(
      catchError(() => of(null)),
      tap(caixa => {
        this.caixaAtual.set(caixa);
        this.carregado.set(true);
      })
    );
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
