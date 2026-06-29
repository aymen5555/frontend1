import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Galerie } from '../models/galerie.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GalerieService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/galeries`;

  list(complexeId: number): Observable<{ success: boolean; data: Galerie[] }> {
    return this.http.get<{ success: boolean; data: Galerie[] }>(`${this.api}/${complexeId}`);
  }

  create(complexeId: number, payload: { image_g: string; imageKit_file_id_g?: string; ordre?: number }): Observable<{ success: boolean; data: Galerie }> {
    return this.http.post<{ success: boolean; data: Galerie }>(`${this.api}/${complexeId}`, payload);
  }

  delete(complexeId: number, galerieId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/${complexeId}/${galerieId}`);
  }
}
