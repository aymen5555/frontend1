import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProfilFitness, ProfilFitnessPayload } from '../models/profil-fitness.model';
import { environment } from '../../environments/environment';

interface ApiItem<T> { success: boolean; data: T; message?: string }

@Injectable({ providedIn: 'root' })
export class ProfilFitnessService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/profile-fitness`;

  /**
   * Get the current user's fitness profile.
   * Returns null (not 404) if no profile exists yet.
   */
  getMine(): Observable<ProfilFitness | null> {
    return this.http.get<ApiItem<ProfilFitness | null>>(this.api).pipe(map(r => r.data));
  }

  create(payload: ProfilFitnessPayload): Observable<ProfilFitness> {
    return this.http.post<ApiItem<ProfilFitness>>(this.api, payload).pipe(map(r => r.data));
  }

  update(payload: ProfilFitnessPayload): Observable<ProfilFitness> {
    return this.http.put<ApiItem<ProfilFitness>>(this.api, payload).pipe(map(r => r.data));
  }
}
