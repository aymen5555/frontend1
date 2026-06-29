import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FournisseurInterne } from '../models/fournisseur-interne.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FournisseurInterneService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/fournisseurs-internes`;

  list(params?: { search?: string; actif?: boolean }): Observable<{ success: boolean; data: FournisseurInterne[]; meta?: any }> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.actif !== undefined) qs.set('actif', String(params.actif));
    const q = qs.toString();
    return this.http.get<{ success: boolean; data: FournisseurInterne[]; meta?: any }>(`${this.api}${q ? '?' + q : ''}`);
  }

  get(id: number): Observable<{ success: boolean; data: FournisseurInterne }> {
    return this.http.get<{ success: boolean; data: FournisseurInterne }>(`${this.api}/${id}`);
  }

  create(payload: { complexe_id: number; nom_f_int: string; raison_sociale_f_int?: string; contact_f_int?: string; tel_f_int?: string; email_f_int?: string; adresse_f_int?: string; matricule_fiscale_f_int?: string }): Observable<{ success: boolean; data: FournisseurInterne }> {
    return this.http.post<{ success: boolean; data: FournisseurInterne }>(this.api, payload);
  }

  update(id: number, payload: { nom_f_int?: string; raison_sociale_f_int?: string; contact_f_int?: string; tel_f_int?: string; email_f_int?: string; adresse_f_int?: string; matricule_fiscale_f_int?: string; active?: boolean }): Observable<{ success: boolean; data: FournisseurInterne }> {
    return this.http.put<{ success: boolean; data: FournisseurInterne }>(`${this.api}/${id}`, payload);
  }

  destroy(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/${id}`);
  }

  toggleActive(id: number): Observable<{ success: boolean; data: FournisseurInterne }> {
    return this.http.patch<{ success: boolean; data: FournisseurInterne }>(`${this.api}/${id}/toggle-active`, {});
  }
}
