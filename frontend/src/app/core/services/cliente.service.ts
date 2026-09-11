import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Cliente } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:8080/api/clientes';

  clientes = signal<Cliente[]>([]);

  constructor(private http: HttpClient) {
    this.carregarClientes();
  }

  carregarClientes(): void {
    this.http.get<Cliente[]>(this.apiUrl).subscribe({
      next: (res) => this.clientes.set(res),
      error: () => {}
    });
  }

  private diasDesde(dataIso?: string): number {
    if (!dataIso) return Infinity;
    const diffMs = Date.now() - new Date(dataIso).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  diasSemComprar(cliente: Cliente): number {
    return this.diasDesde(cliente.ultimaCompra);
  }

  getInativos(diasLimite: number): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/inativos`, { params: { dias: diasLimite } });
  }

  criarCliente(dados: Omit<Cliente, 'id' | 'dataCadastro' | 'totalCompras' | 'valorTotalGasto'>): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, dados).pipe(
      tap(cliente => this.clientes.set([...this.clientes(), cliente]))
    );
  }

  atualizarCliente(id: number, dados: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, dados).pipe(
      tap(atualizado => this.clientes.set(this.clientes().map(c => c.id === id ? atualizado : c)))
    );
  }

  excluirCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.clientes.set(this.clientes().filter(c => c.id !== id)))
    );
  }

  /** Atualiza o cache local após uma compra ser registrada pelo backend durante a venda. */
  sincronizarAposCompra(): void {
    this.carregarClientes();
  }
}
