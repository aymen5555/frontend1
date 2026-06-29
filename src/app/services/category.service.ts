import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryItem } from '../models/category.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly publicApi = `${environment.apiUrl}/categories-produits`;
  private readonly adminApi = `${environment.apiUrl}/admin/categories-produits`;

  list(): Observable<{ success: boolean; data: CategoryItem[] }> {
    return this.http.get<{ success: boolean; data: CategoryItem[] }>(this.publicApi);
  }

  adminList(type?: string): Observable<{ success: boolean; data: CategoryItem[] }> {
    const map: Record<string, string> = {
      'produit': this.adminApi,
      'abonnement-adherent': `${environment.apiUrl}/admin/categories-abonnement-adherent`,
      'fournisseur': `${environment.apiUrl}/admin/categories-fournisseurs`,
      'ressource': `${environment.apiUrl}/admin/categories-ressources`,
    };
    const url = map[type || 'produit'];
    return this.http.get<{ success: boolean; data: CategoryItem[] }>(url);
  }

  create(type: string, payload: { nom: string; active?: boolean }): Observable<{ success: boolean; data: CategoryItem }> {
    const map: Record<string, string> = {
      'produit': this.adminApi,
      'abonnement-adherent': `${environment.apiUrl}/admin/categories-abonnement-adherent`,
      'fournisseur': `${environment.apiUrl}/admin/categories-fournisseurs`,
      'ressource': `${environment.apiUrl}/admin/categories-ressources`,
    };
    return this.http.post<{ success: boolean; data: CategoryItem }>(map[type] || this.adminApi, payload);
  }

  update(type: string, id: number, payload: { nom?: string; active?: boolean }): Observable<{ success: boolean; data: CategoryItem }> {
    const map: Record<string, string> = {
      'produit': this.adminApi,
      'abonnement-adherent': `${environment.apiUrl}/admin/categories-abonnement-adherent`,
      'fournisseur': `${environment.apiUrl}/admin/categories-fournisseurs`,
      'ressource': `${environment.apiUrl}/admin/categories-ressources`,
    };
    const url = `${map[type] || this.adminApi}/${id}`;
    return this.http.put<{ success: boolean; data: CategoryItem }>(url, payload);
  }

  delete(type: string, id: number): Observable<{ success: boolean; message: string }> {
    const map: Record<string, string> = {
      'produit': this.adminApi,
      'abonnement-adherent': `${environment.apiUrl}/admin/categories-abonnement-adherent`,
      'fournisseur': `${environment.apiUrl}/admin/categories-fournisseurs`,
      'ressource': `${environment.apiUrl}/admin/categories-ressources`,
    };
    return this.http.delete<{ success: boolean; message: string }>(`${map[type] || this.adminApi}/${id}`);
  }
}
