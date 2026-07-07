import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TypeDepense } from '../models/type-depense.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TypeDepenseService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/types-depenses`;

  list(activeOnly = false): Observable<{ success: boolean; data: TypeDepense[] }> {
    const url = activeOnly ? `${this.api}?active_only=1` : this.api;
    return this.http.get<{ success: boolean; data: TypeDepense[] }>(url);
  }

  create(payload: { designation_ty_dep: string; active?: boolean }): Observable<{ success: boolean; data: TypeDepense }> {
    return this.http.post<{ success: boolean; data: TypeDepense }>(this.api, payload);
  }

  update(id: number, payload: { designation_ty_dep?: string; active?: boolean }): Observable<{ success: boolean; data: TypeDepense }> {
    return this.http.put<{ success: boolean; data: TypeDepense }>(`${this.api}/${id}`, payload);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/${id}`);
  }
}
