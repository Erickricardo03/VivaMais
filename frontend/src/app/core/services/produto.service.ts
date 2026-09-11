import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produto, AlertaProduto, AjusteEstoque } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private apiUrl = `${environment.apiUrl}/produtos`;

  constructor(private http: HttpClient) {}

  getProdutos(termo?: string): Observable<Produto[]> {
    let params = new HttpParams();
    if (termo && termo.trim()) {
      params = params.set('termo', termo.trim());
    }
    return this.http.get<Produto[]>(this.apiUrl, { params });
  }

  getProdutoById(id: number): Observable<Produto> {
    return this.http.get<Produto>(`${this.apiUrl}/${id}`);
  }

  criarProduto(produto: Produto): Observable<Produto> {
    return this.http.post<Produto>(this.apiUrl, produto);
  }

  atualizarProduto(id: number, produto: Produto): Observable<Produto> {
    return this.http.put<Produto>(`${this.apiUrl}/${id}`, produto);
  }

  desativarProduto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  ajustarEstoque(id: number, ajuste: AjusteEstoque): Observable<Produto> {
    return this.http.post<Produto>(`${this.apiUrl}/${id}/ajustar-estoque`, ajuste);
  }

  getAlertasTodos(): Observable<AlertaProduto[]> {
    return this.http.get<AlertaProduto[]>(`${this.apiUrl}/alertas/todos`);
  }

  getAlertasEstoqueBaixo(): Observable<AlertaProduto[]> {
    return this.http.get<AlertaProduto[]>(`${this.apiUrl}/alertas/estoque-baixo`);
  }

  getAlertasValidade(dias: number = 45): Observable<AlertaProduto[]> {
    return this.http.get<AlertaProduto[]>(`${this.apiUrl}/alertas/vencimento?dias=${dias}`);
  }

  getCategorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categorias`);
  }
}
