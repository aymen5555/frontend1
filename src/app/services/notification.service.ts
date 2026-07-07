import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AppNotification {
  id: string;
  type: string;
  data: {
    type?: string;
    message: string;
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/notifications`;

  notifications = signal<AppNotification[]>([]);
  unreadCount = signal<number>(0);

  loadNotifications(): Observable<AppNotification[]> {
    return this.http.get<ApiResponse<AppNotification[]>>(this.api).pipe(
      map(r => r.data),
      tap(data => {
        this.notifications.set(data);
        const unread = data.filter(n => n.read_at === null).length;
        this.unreadCount.set(unread);
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.api}/mark-read`, {}).pipe(
      tap(() => {
        // Optimistically mark all local notifications as read
        this.notifications.update(list =>
          list.map(n => ({ ...n, read_at: new Date().toISOString() }))
        );
        this.unreadCount.set(0);
      })
    );
  }
}
