import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  success(message: string): void {
    this.addToast(message, 'success');
  }

  error(message: string): void {
    this.addToast(message, 'error');
  }

  warning(message: string): void {
    this.addToast(message, 'warning');
  }

  getToasts(): Toast[] {
    return this.toasts();
  }

  removeToast(id: number): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }

  private addToast(message: string, type: 'success' | 'error' | 'warning'): void {
    const id = this.nextId++;
    this.toasts.update(t => [...t, { id, message, type }]);

    setTimeout(() => this.removeToast(id), 3000);
  }
}
