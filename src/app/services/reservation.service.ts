import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reservation, ReservationPayload, ManualReservationPayload } from '../models/reservation.model';
import { environment } from '../../environments/environment';

interface ApiList<T> { success: boolean; data: T[] }
interface ApiItem<T> { success: boolean; data: T; message?: string }

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/reservations`;

  /** GET /reservations?status= — returns logged-in user's own reservations */
  getMine(status?: string): Observable<Reservation[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiList<Reservation>>(this.api, { params }).pipe(map(r => r.data));
  }

  /** GET /reservations — all reservations (admin/gerant) */
  getAll(): Observable<Reservation[]> {
    return this.http.get<ApiList<Reservation>>(this.api).pipe(map(r => r.data));
  }

  /** GET /reservations/{id} */
  getById(id: number): Observable<Reservation> {
    return this.http.get<ApiItem<Reservation>>(`${this.api}/${id}`).pipe(map(r => r.data));
  }

  /** POST /reservations */
  create(payload: ReservationPayload): Observable<Reservation> {
    return this.http.post<ApiItem<Reservation>>(this.api, payload).pipe(map(r => r.data));
  }

  /** PUT /admin/reservations/{id}/confirm-cash — admin confirms cash payment */
  confirmCashPayment(id: number): Observable<Reservation> {
    return this.http.put<ApiItem<Reservation>>(`${environment.apiUrl}/admin/reservations/${id}/confirm-cash`, {}).pipe(map(r => r.data));
  }

  /** PUT /reservations/{id}/cancel (client) */
  cancel(id: number, force: boolean = false): Observable<Reservation> {
    const url = force ? `${this.api}/${id}/cancel?force=true` : `${this.api}/${id}/cancel`;
    return this.http.put<ApiItem<Reservation>>(url, {}).pipe(map(r => r.data));
  }

  /** PUT /reservations/{id}/pay */
  pay(id: number, modalite: 'especes' | 'carte', reference?: string): Observable<Reservation> {
    const body: { modalite_paiement: 'especes' | 'carte'; reference_paiement?: string } = { modalite_paiement: modalite };
    if (reference) body.reference_paiement = reference;
    return this.http.put<ApiItem<Reservation>>(`${this.api}/${id}/pay`, body).pipe(map(r => r.data));
  }

  /** Alias kept for backward compatibility */
  list(filters?: { terrain_id?: number; status?: string }): Observable<Reservation[]> {
    let params = new HttpParams();
    if (filters?.terrain_id) params = params.set('terrain_id', filters.terrain_id);
    if (filters?.status) params = params.set('status', filters.status);
    return this.http.get<ApiList<Reservation>>(this.api, { params }).pipe(map(r => r.data));
  }

  update(id: number, payload: Partial<ReservationPayload>): Observable<Reservation> {
    return this.http.put<ApiItem<Reservation>>(`${this.api}/${id}`, payload).pipe(map(r => r.data));
  }

  /** DELETE /reservations/{id} */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  /** POST /admin/reservations — admin creates a manual reservation for a client */
  createManual(payload: ManualReservationPayload): Observable<Reservation> {
    return this.http.post<ApiItem<Reservation>>(`${environment.apiUrl}/admin/reservations`, payload)
      .pipe(map(r => r.data));
  }

  /** PUT /admin/reservations/{id}/confirm-payment — confirm payment (admin) */
  adminConfirmPayment(id: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/admin/reservations/${id}/confirm-payment`, {});
  }

  /** PUT /admin/reservations/{id}/cancel — cancel reservation (admin) */
  adminCancel(id: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/admin/reservations/${id}`, {});
  }

  /** GET /admin/archives — fetch soft-deleted archives (admin/gerant) */
  getArchives(): Observable<any[]> {
    return this.http.get<ApiList<any>>(`${environment.apiUrl}/admin/archives`).pipe(map(r => r.data));
  }
}