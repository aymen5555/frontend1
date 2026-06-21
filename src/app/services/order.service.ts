import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly clientApi = `${environment.apiUrl}/commandes`;
  private readonly myOrdersApi = `${environment.apiUrl}/mes-commandes`;
  private readonly adminApi = `${environment.apiUrl}/admin/commandes`;

  // Client: Create order (checkout)
  create(payload: { complexe_id: number; modalite_paiement: 'especes' | 'carte'; notes?: string; items: { produit_id: number; quantite: number }[] }): Observable<{ success: boolean; data: Order }> {
    return this.http.post<{ success: boolean; data: Order }>(this.clientApi, payload);
  }

  // Client: Get logged-in user's orders
  getMyOrders(): Observable<{ success: boolean; data: Order[] }> {
    return this.http.get<{ success: boolean; data: Order[] }>(this.myOrdersApi);
  }

  // Client: Get details of an order
  getMyOrderDetail(id: number): Observable<{ success: boolean; data: Order }> {
    return this.http.get<{ success: boolean; data: Order }>(`${this.myOrdersApi}/${id}`);
  }

  // Client: Cancel a pending order
  cancelMyOrder(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.myOrdersApi}/${id}/annuler`);
  }

  // Admin/Gérant: List all orders with filters
  adminList(filters?: { statut?: string; statut_paiement?: string }): Observable<{ success: boolean; data: Order[] }> {
    let params = new HttpParams();
    if (filters) {
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.statut_paiement) params = params.set('statut_paiement', filters.statut_paiement);
    }
    return this.http.get<{ success: boolean; data: Order[] }>(this.adminApi, { params });
  }

  // Admin/Gérant: Update order status
  updateStatus(id: number, statut: string): Observable<{ success: boolean; data: Order }> {
    return this.http.put<{ success: boolean; data: Order }>(`${this.adminApi}/${id}/statut`, { statut });
  }

  // Admin/Gérant: Confirm payment
  confirmPayment(id: number, payload: { modalite_paiement: 'especes' | 'carte'; reference?: string }): Observable<{ success: boolean; data: Order }> {
    return this.http.put<{ success: boolean; data: Order }>(`${this.adminApi}/${id}/confirmer-paiement`, payload);
  }
}
