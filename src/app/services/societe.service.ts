import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Societe, SocietePayload } from '../models/societe.model';
import { Dirigeant } from '../models/dirigeant.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocieteService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/societes`;

  list(): Observable<{ success: boolean; data: Societe[] }> {
    return this.http.get<{ success: boolean; data: Societe[] }>(this.api);
  }

  get(id: number): Observable<{ success: boolean; data: Societe }> {
    return this.http.get<{ success: boolean; data: Societe }>(`${this.api}/${id}`);
  }

  create(payload: SocietePayload): Observable<{ success: boolean; data: Societe }> {
    return this.http.post<{ success: boolean; data: Societe }>(this.api, payload);
  }

  update(id: number, payload: Partial<SocietePayload>): Observable<{ success: boolean; data: Societe }> {
    return this.http.put<{ success: boolean; data: Societe }>(`${this.api}/${id}`, payload);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/${id}`);
  }

  // Dirigeants sub-resource
  listDirigeants(societeId: number): Observable<{ success: boolean; data: Dirigeant[] }> {
    return this.http.get<{ success: boolean; data: Dirigeant[] }>(`${this.api}/${societeId}/dirigeants`);
  }

  addDirigeant(societeId: number, payload: { nom_dir: string; image?: string }): Observable<{ success: boolean; data: Dirigeant }> {
    return this.http.post<{ success: boolean; data: Dirigeant }>(`${this.api}/${societeId}/dirigeants`, payload);
  }

  removeDirigeant(societeId: number, dirigeantId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/${societeId}/dirigeants/${dirigeantId}`);
  }
}
