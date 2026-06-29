import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DirectSale } from '../models/sale.interface';
import { environment } from '../../environments/environment';

export type DirectSalePayload =
  | {
      produit_id: number;
      complexe_id: number;
      quantite: number;
      modalite_paiement: 'especes' | 'carte';
      client_nom?: string;
      user_id?: number;
      notes?: string;
    }
  | {
      complexe_id: number;
      modalite_paiement: 'especes' | 'carte';
      client_nom?: string;
      user_id?: number;
      notes?: string;
      lignes: { produit_id: number; quantite: number }[];
    };

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/admin/ventes-directes`;

  // List direct sales
  list(): Observable<{ success: boolean; data: DirectSale[] }> {
    return this.http.get<{ success: boolean; data: DirectSale[] }>(this.api);
  }

  // Record a direct sale
  create(payload: DirectSalePayload): Observable<{ success: boolean; data: DirectSale }> {
    return this.http.post<{ success: boolean; data: DirectSale }>(this.api, payload);
  }
}
