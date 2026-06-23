import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface ApiItem<T> { success: boolean; data: T; message?: string }

export interface Review {
  id: number;
  user_id: number;
  note: number;
  commentaire?: string | null;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    image_url?: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/notations`;

  getComplexReviews(complexeId: number): Observable<Review[]> {
    return this.http.get<ApiItem<Review[]>>(`${this.api}/complexe/${complexeId}`).pipe(map(r => r.data));
  }

  getProductReviews(produitId: number): Observable<Review[]> {
    return this.http.get<ApiItem<Review[]>>(`${this.api}/produit/${produitId}`).pipe(map(r => r.data));
  }

  submitComplexReview(complexeId: number, note: number, commentaire?: string): Observable<any> {
    return this.http.post(`${this.api}/complexe`, { complexe_id: complexeId, note, commentaire });
  }

  submitProductReview(produitId: number, note: number, commentaire?: string): Observable<any> {
    return this.http.post(`${this.api}/produit`, { produit_id: produitId, note, commentaire });
  }

  deleteComplexReview(id: number): Observable<any> {
    return this.http.delete(`${this.api}/complexe/${id}`);
  }

  deleteProductReview(id: number): Observable<any> {
    return this.http.delete(`${this.api}/produit/${id}`);
  }

  getEligibility(params: { complexe_id?: number; produit_id?: number }): Observable<{ eligible: boolean; already_rated: boolean }> {
    let httpParams = new HttpParams();
    if (params.complexe_id) {
      httpParams = httpParams.set('complexe_id', params.complexe_id.toString());
    }
    if (params.produit_id) {
      httpParams = httpParams.set('produit_id', params.produit_id.toString());
    }
    return this.http.get<{ eligible: boolean; already_rated: boolean }>(`${this.api}/eligibility`, { params: httpParams });
  }

  getEligibleList(): Observable<{ eligible_complexes: number[]; eligible_produits: number[] }> {
    return this.http.get<{ eligible_complexes: number[]; eligible_produits: number[] }>(`${this.api}/eligibility`);
  }
}
