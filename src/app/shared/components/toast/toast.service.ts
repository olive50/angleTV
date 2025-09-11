import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  success(message: string, title?: string, durationMs = 3000) {
    this.push({ type: 'success', message, title, durationMs });
  }

  error(message: string, title?: string, durationMs = 5000) {
    this.push({ type: 'error', message, title, durationMs });
  }

  warning(message: string, title?: string, durationMs = 4000) {
    this.push({ type: 'warning', message, title, durationMs });
  }

  info(message: string, title?: string, durationMs = 3000) {
    this.push({ type: 'info', message, title, durationMs });
  }

  remove(id: string) {
    const next = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(next);
  }

  clear() {
    this.toastsSubject.next([]);
  }

  private push(toast: Omit<ToastMessage, 'id'>) {
    const id = this.generateId();
    const full: ToastMessage = { id, ...toast };
    this.toastsSubject.next([full, ...this.toastsSubject.value]);

    if (full.durationMs && full.durationMs > 0) {
      setTimeout(() => this.remove(id), full.durationMs);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

