import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RecommendationResponse, RecommendationItem } from '../models/profil-fitness.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecommandationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/recommendations`;

  /**
   * GET /api/recommendations
   * Returns top 3 recommendations for the authenticated user.
   * If no profile exists, returns top complexes by rating.
   */
  getMine(): Observable<{ has_profile: boolean; recommendations: RecommendationItem[] }> {
    return this.http.get<RecommendationResponse>(this.api).pipe(
      map(r => ({
        has_profile: r.has_profile,
        recommendations: r.recommendations || [],
      }))
    );
  }
}
