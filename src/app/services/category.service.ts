import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly publicApi = `${environment.apiUrl}/categories-produits`;
  private readonly adminApi = `${environment.apiUrl}/admin/categories-produits`;

  // Public: List active categories
  list(): Observable<{ success: boolean; data: Category[] }> {
    return this.http.get<{ success: boolean; data: Category[] }>(this.publicApi);
  }

  // Super Admin: Create a new category
  create(payload: { nom: string; description?: string }): Observable<{ success: boolean; data: Category }> {
    return this.http.post<{ success: boolean; data: Category }>(this.adminApi, payload);
  }

  // Super Admin: Update a category
  update(id: number, payload: { nom?: string; description?: string; active?: boolean }): Observable<{ success: boolean; data: Category }> {
    return this.http.put<{ success: boolean; data: Category }>(`${this.adminApi}/${id}`, payload);
  }

  // Super Admin: Deactivate a category
  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.adminApi}/${id}`);
  }
}
