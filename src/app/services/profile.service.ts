import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/auth.model';
import { environment } from '../../environments/environment';

interface ApiItem<T> { success: boolean; data: T; message?: string }

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/profile`;

  /**
   * Get the current user's profile.
   */
  getProfile(): Observable<User> {
    return this.http.get<ApiItem<{ user: User }>>(this.api).pipe(map(r => r.data.user));
  }

  /**
   * Update the current user's profile.
   */
  updateProfile(payload: Partial<User>): Observable<User> {
    return this.http.put<ApiItem<{ user: User }>>(this.api, payload).pipe(map(r => r.data.user));
  }
}
