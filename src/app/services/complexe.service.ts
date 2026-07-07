import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Complexe, ComplexePayload } from '../models/complexe.model';
import { environment } from '../../environments/environment';

interface ApiList<T> { success: boolean; data: T[] }
interface ApiItem<T> { success: boolean; data: T; message?: string }

@Injectable({ providedIn: 'root' })
export class ComplexeService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/complexes`;

  /** GET /complexes */
  getAll(): Observable<Complexe[]> {
    return this.http.get<ApiList<Complexe>>(this.api).pipe(map(r => r.data));
  }

  /** GET /complexes/{id} */
  getById(id: number): Observable<Complexe> {
    return this.http.get<ApiItem<Complexe>>(`${this.api}/${id}`).pipe(map(r => r.data));
  }

  /** POST /complexes */
  create(payload: ComplexePayload): Observable<Complexe> {
    return this.http.post<ApiItem<Complexe>>(this.api, payload).pipe(map(r => r.data));
  }

  /** PUT /complexes/{id} */
  update(id: number, payload: Partial<ComplexePayload>): Observable<Complexe> {
    return this.http.put<ApiItem<Complexe>>(`${this.api}/${id}`, payload).pipe(map(r => r.data));
  }

  /** DELETE /complexes/{id} */
  delete(id: number): Observable<void> {
    return this.http.delete(`${this.api}/${id}`).pipe(map(() => undefined));
  }

  /** GET /admin/complexes/deleted — super_admin only */
  getDeleted(): Observable<Complexe[]> {
    return this.http.get<ApiList<Complexe>>(`${environment.apiUrl}/admin/complexes/deleted`).pipe(map(r => r.data));
  }

  /** POST /admin/complexes/{id}/restore — super_admin only */
  restore(id: number): Observable<Complexe> {
    return this.http.post<ApiItem<Complexe>>(`${environment.apiUrl}/admin/complexes/${id}/restore`, {}).pipe(map(r => r.data));
  }

  /** Alias kept for backward compatibility */
  list(): Observable<Complexe[]> {
    return this.getAll();
  }

  getUnassigned(): Observable<Complexe[]> {
    return this.http.get<ApiList<Complexe>>(`${this.api}?unassigned=true`).pipe(map(r => r.data));
  }

  get(id: number): Observable<Complexe> {
    return this.getById(id);
  }
}
