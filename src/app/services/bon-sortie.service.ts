import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BonSortie } from '../models/bon-sortie.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BonSortieService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/bons-sortie`;

  list(params?: { complexe_id?: number; date_debut?: string; date_fin?: string }): Observable<{ success: boolean; data: BonSortie[]; meta?: any }> {
    const qs = new URLSearchParams();
    if (params?.complexe_id) qs.set('complexe_id', String(params.complexe_id));
    if (params?.date_debut) qs.set('date_debut', params.date_debut);
    if (params?.date_fin) qs.set('date_fin', params.date_fin);
    const q = qs.toString();
    return this.http.get<{ success: boolean; data: BonSortie[]; meta?: any }>(`${this.api}${q ? '?' + q : ''}`);
  }

  get(id: number): Observable<{ success: boolean; data: BonSortie }> {
    return this.http.get<{ success: boolean; data: BonSortie }>(`${this.api}/${id}`);
  }

  create(payload: { complexe_id: number; date_bon_sor: string; motif?: string; lignes: { produit_id: number; quantite: number }[] }): Observable<{ success: boolean; data: BonSortie; reference: string }> {
    return this.http.post<{ success: boolean; data: BonSortie; reference: string }>(this.api, payload);
  }
}
