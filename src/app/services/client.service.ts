import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Client } from '../models/client.model';
import { environment } from '../../environments/environment';

interface ApiList<T> { success: boolean; data: T[] }
interface ApiItem<T> { success: boolean; data: T; message?: string }

@Injectable({ providedIn: 'root' })
export class ClientService {
    private readonly http = inject(HttpClient);
    private readonly api = `${environment.apiUrl}/clients`;

    list(): Observable<Client[]> {
        return this.http.get<ApiList<Client>>(this.api).pipe(map((r) => r.data));
    }

    setActive(id: number, isActive: boolean): Observable<Client> {
        return this.http.patch<ApiItem<Client>>(`${this.api}/${id}`, { is_active: isActive })
            .pipe(map((r) => r.data));
    }
}
