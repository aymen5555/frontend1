import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/produits`;
  private readonly adminApi = `${environment.apiUrl}/admin/produits`;

  // Public: List products with optional search and filters
  list(filters?: { complexe_id?: number; categorie_id?: number; sport_cible?: string; search?: string; per_page?: number }): Observable<{ success: boolean; data: Product[] }> {
    let params = new HttpParams();
    if (filters) {
      if (filters.complexe_id) params = params.set('complexe_id', filters.complexe_id.toString());
      if (filters.categorie_id) params = params.set('categorie_id', filters.categorie_id.toString());
      if (filters.sport_cible) params = params.set('sport_cible', filters.sport_cible);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
    }
    return this.http.get<{ success: boolean; data: Product[] }>(this.api, { params });
  }

  // Public: Get product by ID
  get(id: number): Observable<{ success: boolean; data: Product }> {
    return this.http.get<{ success: boolean; data: Product }>(`${this.api}/${id}`);
  }

  // Admin: Get all products for admin panel
  adminList(): Observable<{ success: boolean; data: Product[] }> {
    return this.http.get<{ success: boolean; data: Product[] }>(this.adminApi);
  }

  // Admin: Create new product
  create(payload: any): Observable<{ success: boolean; data: Product }> {
    return this.http.post<{ success: boolean; data: Product }>(this.adminApi, payload);
  }

  // Admin: Update product details
  update(id: number, payload: any): Observable<{ success: boolean; data: Product }> {
    return this.http.put<{ success: boolean; data: Product }>(`${this.adminApi}/${id}`, payload);
  }

  // Admin: Deactivate product
  deactivate(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.adminApi}/${id}`);
  }

  // Admin: Update product stock
  updateStock(id: number, payload: { quantite_disponible: number; quantite_minimale?: number }): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(`${this.adminApi}/${id}/stock`, payload);
  }
}
