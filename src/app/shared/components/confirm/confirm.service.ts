import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmState {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private stateSubject = new BehaviorSubject<ConfirmState | null>(null);
  state$ = this.stateSubject.asObservable();

  open(title: string, message: string, confirmText = 'Confirm', cancelText = 'Cancel'): Promise<boolean> {
    const id = this.generateId();
    const state: ConfirmState = { id, title, message, confirmText, cancelText };
    this.stateSubject.next(state);

    return new Promise<boolean>((resolve) => {
      const handler = (result: boolean) => {
        resolve(result);
        this.stateSubject.next(null);
      };
      (this as any)[`resolver_${id}`] = handler;
    });
  }

  confirm(id: string) {
    const resolver = (this as any)[`resolver_${id}`];
    if (resolver) resolver(true);
  }

  cancel(id: string) {
    const resolver = (this as any)[`resolver_${id}`];
    if (resolver) resolver(false);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

