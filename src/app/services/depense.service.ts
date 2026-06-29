import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Depense } from '../models/depense.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DepenseService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/depenses`;

  list(filters?: { complexe_id?: number; type_depense_id?: number; date_debut?: string; date_fin?: string }): Observable<{ success: boolean; data: Depense[]; meta?: any }> {
    let params = new HttpParams();
    if (filters) {
      if (filters.complexe_id) params = params.set('complexe_id', String(filters.complexe_id));
      if (filters.type_depense_id) params = params.set('type_depense_id', String(filters.type_depense_id));
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
    }
    return this.http.get<{ success: boolean; data: Depense[]; meta?: any }>(`${this.api}${params.toString() ? '?' + params.toString() : ''}`);
  }

  create(payload: { date_depense: string; montant_dep: number; commentaire_dep?: string; type_depense_id: number; complexe_id: number }): Observable<{ success: boolean; data: Depense }> {
    return this.http.post<{ success: boolean; data: Depense }>(this.api, payload);
  }

  update(id: number, payload: Partial<{ date_depense: string; montant_dep: number; commentaire_dep: string; type_depense_id: number; complexe_id: number }>): Observable<{ success: boolean; data: Depense }> {
    return this.http.put<{ success: boolean; data: Depense }>(`${this.api}/${id}`, payload);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/${id}`);
  }
}
