import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TypeAbonnement, AbonnementAdherent } from '../models/abonnement-adherent.model';
import { environment } from '../../environments/environment';
import { of } from 'rxjs';

interface ApiList<T> { success: boolean; data: T[] }
interface ApiItem<T> { success: boolean; data: T; message?: string }

@Injectable({ providedIn: 'root' })
export class AbonnementService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiUrl;
  // simple in-memory cache for abonnement types per complexe
  private typesCache: Map<string, TypeAbonnement[]> = new Map();

  // ──────────────────────────────────────────────
  // LEGACY METHODS (Backward compatibility for SubscriptionComponent)
  // ──────────────────────────────────────────────

  legacyGetMine(): Observable<import('../models/abonnement.model').Abonnement[]> {
    return this.http.get<ApiList<import('../models/abonnement.model').Abonnement>>(`${this.apiBase}/abonnements`).pipe(map(r => r.data));
  }

  legacyCreate(payload: { type: 'MONTHLY' | 'YEARLY'; payment_method: 'carte' | 'especes'; price: number }): Observable<import('../models/abonnement.model').Abonnement> {
    return this.http.post<ApiItem<import('../models/abonnement.model').Abonnement>>(`${this.apiBase}/abonnements`, payload).pipe(map(r => r.data));
  }

  legacyConfirmPayment(id: number, reference: string): Observable<import('../models/abonnement.model').Abonnement> {
    return this.http.put<ApiItem<import('../models/abonnement.model').Abonnement>>(`${this.apiBase}/abonnements/${id}/confirm-payment`, { reference }).pipe(map(r => r.data));
  }

  cancel(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/abonnement-adherents/${id}/cancel`, {});
  }

  // Legacy cancel route (for old subscription endpoints)
  legacyCancel(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/abonnements/${id}/cancel`, {});
  }

  deleteAbonnement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/abonnement-adherents/${id}`);
  }

  // ──────────────────────────────────────────────
  // CLIENT METHODS
  // ──────────────────────────────────────────────

  getTypesDisponibles(complexeId?: number): Observable<TypeAbonnement[]> {
    const key = String(complexeId || 0);
    const cached = this.typesCache.get(key);
    if (cached) return of(cached);

    const url = `${this.apiBase}/abonnements/types`;
    const params = complexeId && complexeId > 0 ? new HttpParams().set('complexe_id', complexeId.toString()) : undefined as any;
    return this.http.get<ApiList<TypeAbonnement>>(url, params ? { params } : undefined)
      .pipe(map(r => {
        this.typesCache.set(key, r.data);
        return r.data;
      }));
  }

  getMesAbonnements(): Observable<AbonnementAdherent[]> {
    return this.http.get<ApiList<AbonnementAdherent>>(`${this.apiBase}/mes-abonnements`)
      .pipe(map(r => r.data));
  }

  souscrire(typeAbonnementId: number, modalitePaiement: 'especes' | 'carte', dateDebut: string, reference?: string): Observable<AbonnementAdherent> {
    const payload: any = {
      type_abonnement_id: typeAbonnementId,
      modalite_paiement: modalitePaiement,
      date_debut: dateDebut,
    };
    if (reference) payload.reference = reference;
    return this.http.post<ApiItem<AbonnementAdherent>>(`${this.apiBase}/abonnements/souscrire`, payload).pipe(map(r => r.data));
  }

  getAbonnementDetail(id: number): Observable<AbonnementAdherent> {
    return this.http.get<ApiItem<AbonnementAdherent>>(`${this.apiBase}/abonnements-adherent/${id}`)
      .pipe(map(r => r.data));
  }

  payAbonnement(id: number, payload: { modalite_paiement: 'especes' | 'carte'; reference?: string }): Observable<AbonnementAdherent> {
    return this.http.put<ApiItem<AbonnementAdherent>>(`${this.apiBase}/abonnement-adherents/${id}/pay`, payload)
      .pipe(map(r => r.data));
  }

  // ──────────────────────────────────────────────
  // GERANT / SUPER_ADMIN METHODS
  // ──────────────────────────────────────────────

  adminGetTypes(complexeId?: number | null): Observable<TypeAbonnement[]> {
    const url = `${this.apiBase}/admin/abonnements/types`;
    const params = (typeof complexeId === 'number' && complexeId > 0) ? new HttpParams().set('complexe_id', String(complexeId)) : undefined as any;
    return this.http.get<ApiList<TypeAbonnement>>(url, params ? { params } : undefined).pipe(map(r => r.data));
  }

  adminStoreType(payload: Partial<TypeAbonnement>): Observable<TypeAbonnement> {
    return this.http.post<ApiItem<TypeAbonnement>>(`${this.apiBase}/admin/abonnements/types`, payload)
      .pipe(map(r => r.data));
  }

  adminUpdateType(id: number, payload: Partial<TypeAbonnement>): Observable<TypeAbonnement> {
    return this.http.put<ApiItem<TypeAbonnement>>(`${this.apiBase}/admin/abonnements/types/${id}`, payload)
      .pipe(map(r => r.data));
  }

  adminDeleteType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/admin/abonnements/types/${id}`);
  }

  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/admin/abonnements-adherent/${id}`);
  }

  adminGetAbonnements(complexeId?: number | null): Observable<AbonnementAdherent[]> {
    const url = `${this.apiBase}/admin/abonnements-adherent`;
    const params = (typeof complexeId === 'number' && complexeId > 0) ? new HttpParams().set('complexe_id', String(complexeId)) : undefined as any;
    return this.http.get<ApiList<AbonnementAdherent>>(url, params ? { params } : undefined)
      .pipe(map(r => r.data));
  }

  adminStats(): Observable<any> {
    return this.http.get<ApiItem<any>>(`${this.apiBase}/admin/abonnements/stats`).pipe(map(r => r.data));
  }

  adminConfirmPayment(id: number, payload: { modalite_paiement: 'especes' | 'carte'; reference?: string; montant: number }): Observable<AbonnementAdherent> {
    return this.http.put<ApiItem<AbonnementAdherent>>(`${this.apiBase}/admin/abonnements-adherent/${id}/confirm-payment`, payload)
      .pipe(map(r => r.data));
  }

  adminCancel(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/admin/abonnements-adherent/${id}/cancel`, {});
  }
}