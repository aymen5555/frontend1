import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Activite, ReservationActivite, ActiviteFilters } from '../models/activite.model';
import { environment } from '../../environments/environment';

interface ApiList<T> { success: boolean; data: T[] }
interface ApiItem<T> { success: boolean; data: T; message?: string }
interface PlacesResponse { success: boolean; places_restantes: number; booked: number | null; message?: string }

@Injectable({ providedIn: 'root' })
export class ActiviteService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  /** DELETE /admin/activites/reservations/{id} — admin hard-delete reservation */
  adminDeleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/activites/reservations/${id}`);
  }

  /** GET /activites — public, supports filters */
  getAll(filters?: ActiviteFilters): Observable<Activite[]> {
    let params = new HttpParams();
    if (filters?.complexe_id) params = params.set('complexe_id', filters.complexe_id);
    if (filters?.sport)       params = params.set('sport', filters.sport);
    if (filters?.niveau)      params = params.set('niveau', filters.niveau);
    return this.http.get<ApiList<Activite>>(`${this.api}/activites`, { params }).pipe(map(r => r.data));
  }

  /** GET /activites/{id} — public */
  getById(id: number): Observable<Activite> {
    return this.http.get<ApiItem<Activite>>(`${this.api}/activites/${id}`).pipe(map(r => r.data));
  }

  /** GET /activites/{id}/places?date=YYYY-MM-DD */
  getPlaces(id: number, date: string): Observable<PlacesResponse> {
    const params = new HttpParams().set('date', date);
    return this.http.get<PlacesResponse>(`${this.api}/activites/${id}/places`, { params });
  }

  /** POST /activites/{id}/reserver — client */
  reserver(id: number, data: { date_seance: string; modalite_paiement: 'especes' | 'carte' }): Observable<ReservationActivite> {
    return this.http.post<ApiItem<ReservationActivite>>(`${this.api}/activites/${id}/reserver`, data).pipe(map(r => r.data));
  }

  /** GET /mes-activites — client */
  getMesActivites(): Observable<ReservationActivite[]> {
    return this.http.get<ApiList<ReservationActivite>>(`${this.api}/mes-activites`).pipe(map(r => r.data));
  }

  /** DELETE /activites/reservations/{id} — client cancel */
  cancelReservation(id: number, force = false): Observable<void> {
    const params = force ? '?force=true' : '';
    return this.http.delete<void>(`${this.api}/activites/reservations/${id}${params}`);
  }

  /** DELETE /activites/reservations/{id}/delete — client delete cancelled activity reservation */
  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/activites/reservations/${id}/delete`);
  }

  /** PUT /activites/reservations/{id}/pay — client card payment */
  payReservation(id: number): Observable<ReservationActivite> {
    return this.http.put<ApiItem<ReservationActivite>>(`${this.api}/activites/reservations/${id}/pay`, {}).pipe(map(r => r.data));
  }

  /** GET /admin/activites */
  adminGetAll(): Observable<Activite[]> {
    return this.http.get<ApiList<Activite>>(`${this.api}/admin/activites`).pipe(map(r => r.data));
  }

  /** POST /admin/activites */
  adminCreate(data: Partial<Activite>): Observable<Activite> {
    return this.http.post<ApiItem<Activite>>(`${this.api}/admin/activites`, data).pipe(map(r => r.data));
  }

  /** PUT /admin/activites/{id} */
  adminUpdate(id: number, data: Partial<Activite>): Observable<Activite> {
    return this.http.put<ApiItem<Activite>>(`${this.api}/admin/activites/${id}`, data).pipe(map(r => r.data));
  }

  /** DELETE /admin/activites/{id} — soft delete */
  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/activites/${id}`);
  }

  /** GET /admin/activites/reservations */
  adminGetReservations(): Observable<ReservationActivite[]> {
    return this.http.get<ApiList<ReservationActivite>>(`${this.api}/admin/activites/reservations`).pipe(map(r => r.data));
  }

  /** PUT /admin/activites/reservations/{id}/confirm */
  adminConfirmPayment(id: number, data: { modalite_paiement: 'especes' | 'carte'; statut_paiement: 'paye'; reference?: string; montant?: number }): Observable<void> {
    return this.http.put<void>(`${this.api}/admin/activites/reservations/${id}/confirm`, data);
  }

  /** PUT /admin/activites/reservations/{id}/cancel */
  adminCancelReservation(id: number): Observable<void> {
    return this.http.put<void>(`${this.api}/admin/activites/reservations/${id}/cancel`, {});
  }
}
