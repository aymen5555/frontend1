import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Complexe {
  id: number;
  name: string;
  description?: string;
  address?: string;
}

export interface Gerant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  complexe: Complexe | null;
  created_at: string;
}

export interface CreateGerantPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  complexe_id: number;
  phone?: string;
}

interface ApiList<T> { success: boolean; data: T[] }
interface ApiItem<T> { success: boolean; data: T; message?: string }

@Injectable({ providedIn: 'root' })
export class GerantService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/gerants`;

  /** GET /admin/gerants */
  list(): Observable<Gerant[]> {
    return this.http.get<ApiList<Gerant>>(this.api).pipe(map(r => r.data));
  }

  /** POST /admin/gerants */
  create(payload: CreateGerantPayload): Observable<Gerant> {
    return this.http.post<ApiItem<Gerant>>(this.api, payload).pipe(map(r => r.data));
  }

  /** PATCH /admin/gerants/{id} */
  deactivate(id: number): Observable<{ id: number; is_active: boolean }> {
    return this.http.patch<ApiItem<{ id: number; is_active: boolean }>>(`${this.api}/${id}`, {}).pipe(map(r => r.data));
  }

  /** POST /admin/gerants/{id}/activate */
  activate(id: number): Observable<{ id: number; is_active: boolean }> {
    return this.http.post<ApiItem<{ id: number; is_active: boolean }>>(`${this.api}/${id}/activate`, {}).pipe(map(r => r.data));
  }

  /** PUT /admin/gerants/{id}/complexe — assign or unassign complexe to gerant */
  assignComplexe(gerantId: number, complexeId: number | null): Observable<Gerant> {
    return this.http.put<ApiItem<Gerant>>(`${this.api}/${gerantId}/complexe`, { complexe_id: complexeId }).pipe(map(r => r.data));
  }
  /** DELETE /admin/gerants/{id} */
  deleteGerant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
