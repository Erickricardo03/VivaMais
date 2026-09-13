import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardResumo, FaturamentoPeriodo } from '../models/models';
import { apiBaseUrl } from '../api-url';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${apiBaseUrl()}/dashboard`;

  constructor(private http: HttpClient) {}

  getResumo(): Observable<DashboardResumo> {
    return this.http.get<DashboardResumo>(`${this.apiUrl}/resumo`);
  }

  getFaturamento(periodo: string, inicio?: string, fim?: string): Observable<FaturamentoPeriodo> {
    let params = new HttpParams().set('periodo', periodo);
    if (inicio) params = params.set('inicio', inicio);
    if (fim) params = params.set('fim', fim);
    return this.http.get<FaturamentoPeriodo>(`${this.apiUrl}/faturamento`, { params });
  }
}
