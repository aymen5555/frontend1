import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BonEntree } from '../models/bon-entree.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BonEntreeService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/bons-entree`;

  list(params?: { complexe_id?: number; date_debut?: string; date_fin?: string }): Observable<{ success: boolean; data: BonEntree[]; meta?: any }> {
    const qs = new URLSearchParams();
    if (params?.complexe_id) qs.set('complexe_id', String(params.complexe_id));
    if (params?.date_debut) qs.set('date_debut', params.date_debut);
    if (params?.date_fin) qs.set('date_fin', params.date_fin);
    const q = qs.toString();
    return this.http.get<{ success: boolean; data: BonEntree[]; meta?: any }>(`${this.api}${q ? '?' + q : ''}`);
  }

  get(id: number): Observable<{ success: boolean; data: BonEntree }> {
    return this.http.get<{ success: boolean; data: BonEntree }>(`${this.api}/${id}`);
  }

  create(payload: { fournisseur_interne_id: number; complexe_id: number; date_bon_ent: string; lignes: { produit_id: number; quantite: number; prix_unitaire: number }[] }): Observable<{ success: boolean; data: BonEntree; reference: string }> {
    return this.http.post<{ success: boolean; data: BonEntree; reference: string }>(this.api, payload);
  }

  confirmPayment(id: number, payload: { montant: number; type?: string; reference?: string }) {
    return this.http.put<{ success: boolean; data: any }>(`${this.api}/${id}/confirmer-paiement`, payload);
  }
}
