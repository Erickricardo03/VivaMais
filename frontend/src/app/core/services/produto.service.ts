import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { Produto, AlertaProduto, AjusteEstoque, LeituraBalanca } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private apiUrl = `${environment.apiUrl}/produtos`;

  produtos = signal<Produto[]>([]);
  categorias = signal<string[]>([]);
  alertas = signal<AlertaProduto[]>([]);

  constructor(private http: HttpClient) {
    this.carregarDadosIniciais();
  }

  private carregarDadosIniciais(): void {
    this.getProdutos().subscribe();
    this.getCategorias().subscribe();
    this.getAlertasTodos().subscribe();
  }

  getProdutos(termo?: string): Observable<Produto[]> {
    let params = new HttpParams();
    if (termo && termo.trim()) {
      params = params.set('termo', termo.trim());
      return this.http.get<Produto[]>(this.apiUrl, { params });
    }
    return this.http.get<Produto[]>(this.apiUrl).pipe(
      tap(lista => this.produtos.set(lista))
    );
  }

  getProdutoById(id: number): Observable<Produto> {
    const cached = this.produtos().find(p => p.id === id);
    if (cached) {
      return of(cached);
    }
    return this.http.get<Produto>(`${this.apiUrl}/${id}`);
  }

  criarProduto(produto: Produto): Observable<Produto> {
    return this.http.post<Produto>(this.apiUrl, produto).pipe(
      tap(novo => {
        this.produtos.set([...this.produtos(), novo]);
        this.getAlertasTodos().subscribe();
        this.getCategorias().subscribe();
      })
    );
  }

  atualizarProduto(id: number, produto: Produto): Observable<Produto> {
    return this.http.put<Produto>(`${this.apiUrl}/${id}`, produto).pipe(
      tap(atualizado => {
        this.produtos.set(this.produtos().map(p => p.id === id ? atualizado : p));
        this.getAlertasTodos().subscribe();
      })
    );
  }

  desativarProduto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.produtos.set(this.produtos().filter(p => p.id !== id));
        this.getAlertasTodos().subscribe();
      })
    );
  }

  ajustarEstoque(id: number, ajuste: AjusteEstoque): Observable<Produto> {
    return this.http.post<Produto>(`${this.apiUrl}/${id}/ajustar-estoque`, ajuste).pipe(
      tap(atualizado => {
        this.produtos.set(this.produtos().map(p => p.id === id ? atualizado : p));
        this.getAlertasTodos().subscribe();
      })
    );
  }

  getAlertasTodos(): Observable<AlertaProduto[]> {
    return this.http.get<AlertaProduto[]>(`${this.apiUrl}/alertas/todos`).pipe(
      tap(lista => this.alertas.set(lista))
    );
  }

  getAlertasEstoqueBaixo(): Observable<AlertaProduto[]> {
    return this.http.get<AlertaProduto[]>(`${this.apiUrl}/alertas/estoque-baixo`);
  }

  getAlertasValidade(dias: number = 45): Observable<AlertaProduto[]> {
    return this.http.get<AlertaProduto[]>(`${this.apiUrl}/alertas/vencimento?dias=${dias}`);
  }

  getCategorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categorias`).pipe(
      tap(cats => this.categorias.set(cats))
    );
  }

  lerCodigoBalanca(codigo: string): Observable<LeituraBalanca> {
    return this.http.post<LeituraBalanca>(`${this.apiUrl}/ler-codigo-balanca`, { codigo });
  }
}
