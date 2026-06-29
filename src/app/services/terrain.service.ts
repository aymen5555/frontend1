import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Terrain, TerrainPayload } from '../models/terrain.model';
import { Slot } from '../models/slot.model';
import { environment } from '../../environments/environment';

interface ApiList<T> { success: boolean; data: T[] }
interface ApiItem<T> { success: boolean; data: T }
interface ApiSlotsResponse { terrain_id: number; terrain_name: string; date: string; timezone: string; slots: Slot[] }

@Injectable({ providedIn: 'root' })
export class TerrainService {
    private readonly http = inject(HttpClient);
    private readonly api = `${environment.apiUrl}/terrains`;

    list(complexeId?: number): Observable<Terrain[]> {
        let params = new HttpParams();
        if (complexeId) {
            params = params.set('complexe_id', complexeId);
        }
        return this.http.get<ApiList<Terrain>>(this.api, { params }).pipe(map((r) => r.data));
    }

    get(id: number): Observable<Terrain> {
        return this.http.get<ApiItem<Terrain>>(`${this.api}/${id}`).pipe(map((r) => r.data));
    }

    create(payload: TerrainPayload): Observable<Terrain> {
        return this.http.post<ApiItem<Terrain>>(this.api, payload).pipe(map((r) => r.data));
    }

    update(id: number, payload: Partial<TerrainPayload>): Observable<Terrain> {
        return this.http.put<ApiItem<Terrain>>(`${this.api}/${id}`, payload).pipe(map((r) => r.data));
    }

    delete(id: number): Observable<void> {
        return this.http.delete(`${this.api}/${id}`).pipe(map(() => undefined));
    }

    getSlots(id: number, date: string, timezone?: string): Observable<Slot[]> {
        let params = new HttpParams().set('date', date);
        if (timezone) {
            params = params.set('timezone', timezone);
        }
        return this.http.get<ApiItem<ApiSlotsResponse>>(`${this.api}/${id}/slots`, { params }).pipe(
            map((r) => {
                if (Array.isArray((r as any).data)) {
                    return (r as any).data as Slot[];
                }
                return (r.data.slots ?? []) as Slot[];
            })
        );
    }

    getAll(complexeId?: number): Observable<Terrain[]> {
        return this.list(complexeId);
    }

    getById(id: number): Observable<Terrain> {
        return this.get(id);
    }
}
