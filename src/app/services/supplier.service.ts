import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier } from '../models/supplier.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/fournisseurs`;

  // List suppliers
  list(): Observable<{ success: boolean; data: Supplier[] }> {
    return this.http.get<{ success: boolean; data: Supplier[] }>(this.api);
  }

  // Create supplier
  create(payload: { complexe_id: number; nom: string; contact?: string; telephone?: string; email?: string; adresse?: string }): Observable<{ success: boolean; data: Supplier }> {
    return this.http.post<{ success: boolean; data: Supplier }>(this.api, payload);
  }

  // Update supplier
  update(id: number, payload: { nom?: string; contact?: string; telephone?: string; email?: string; adresse?: string; actif?: boolean }): Observable<{ success: boolean; data: Supplier }> {
    return this.http.put<{ success: boolean; data: Supplier }>(`${this.api}/${id}`, payload);
  }

  // Deactivate supplier
  deactivate(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/${id}`);
  }
}
