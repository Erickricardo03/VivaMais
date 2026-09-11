import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VendaRequest, VendaResponse } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VendaService {
  private apiUrl = `${environment.apiUrl}/vendas`;

  constructor(private http: HttpClient) {}

  finalizarVenda(venda: VendaRequest): Observable<VendaResponse> {
    return this.http.post<VendaResponse>(`${this.apiUrl}/finalizar`, venda);
  }

  getVendasRecentes(): Observable<VendaResponse[]> {
    return this.http.get<VendaResponse[]>(this.apiUrl);
  }

  getVendaById(id: number): Observable<VendaResponse> {
    return this.http.get<VendaResponse>(`${this.apiUrl}/${id}`);
  }

  cancelarVenda(id: number): Observable<VendaResponse> {
    return this.http.post<VendaResponse>(`${this.apiUrl}/${id}/cancelar`, {});
  }
}
