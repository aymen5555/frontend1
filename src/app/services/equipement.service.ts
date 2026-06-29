import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Equipement, EquipementPayload } from '../models/equipement.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EquipementService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/equipements`;

  list(): Observable<{ success: boolean; data: Equipement[] }> {
    return this.http.get<{ success: boolean; data: Equipement[] }>(this.api);
  }

  create(payload: EquipementPayload): Observable<{ success: boolean; data: Equipement }> {
    return this.http.post<{ success: boolean; data: Equipement }>(this.api, payload);
  }

  update(id: number, payload: Partial<EquipementPayload>): Observable<{ success: boolean; data: Equipement }> {
    return this.http.put<{ success: boolean; data: Equipement }>(`${this.api}/${id}`, payload);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/${id}`);
  }

  toggleComplexe(equipementId: number, complexeId: number): Observable<{ success: boolean; attached: number[]; detached: number[] }> {
    return this.http.post<{ success: boolean; attached: number[]; detached: number[] }>(`${this.api}/${equipementId}/complexes`, { complexe_id: complexeId });
  }

  getComplexeEquipements(complexeId: number): Observable<{ success: boolean; data: Equipement[] }> {
    return this.http.get<{ success: boolean; data: Equipement[] }>(`${this.api}/complexes/${complexeId}`);
  }
}
