import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DetailAbonnementService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/details-abonnements`;

  list(typeAbonnementId: number): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.api}/${typeAbonnementId}`);
  }

  create(typeAbonnementId: number, payload: { jour_seance: string; heure_debut_de_abo: string; heure_fin_de_abo: string }): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.api}/${typeAbonnementId}`, payload);
  }

  delete(typeAbonnementId: number, detailId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/${typeAbonnementId}/${detailId}`);
  }
}
