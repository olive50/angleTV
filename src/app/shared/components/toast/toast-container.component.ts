import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastMessage, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toasts$ | async" class="toast" [ngClass]="t.type" (click)="dismiss(t.id)">
        <div class="toast-icon" aria-hidden="true">
          <i [ngClass]="iconFor(t.type)"></i>
        </div>
        <div class="toast-content">
          <div class="toast-title" *ngIf="t.title">{{ t.title }}</div>
          <div class="toast-message">{{ t.message }}</div>
        </div>
        <button class="toast-close" aria-label="Dismiss" (click)="dismiss(t.id); $event.stopPropagation()">×</button>
      </div>
    </div>
  `,
  styles: [
    `
    .toast-container { position: fixed; top: 16px; right: 16px; display: flex; flex-direction: column; gap: 10px; z-index: 2000; }
    .toast { display: flex; align-items: start; gap: 10px; min-width: 260px; max-width: 420px; padding: 12px 14px; border-radius: var(--border-radius); box-shadow: var(--shadow-lg); background: var(--white); border: 1px solid var(--gray-200); animation: slide-in .2s ease-out; }
    .toast.success { border-left: 4px solid var(--success-color); }
    .toast.error { border-left: 4px solid var(--danger-color); }
    .toast.warning { border-left: 4px solid var(--warning-color); }
    .toast.info { border-left: 4px solid var(--info-color); }
    .toast-icon { font-size: 18px; margin-top: 2px; }
    .toast-title { font-weight: 600; color: var(--gray-900); margin-bottom: 2px; }
    .toast-message { font-size: 13px; color: var(--gray-700); }
    .toast-close { margin-left: auto; background: none; border: none; font-size: 18px; line-height: 1; cursor: pointer; color: var(--gray-500); }
    .toast-close:hover { color: var(--gray-700); }
    @keyframes slide-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    `
  ]
})
export class ToastContainerComponent {
  toasts$: Observable<ToastMessage[]> = this.toastService.toasts$;

  constructor(private toastService: ToastService) {}

  dismiss(id: string) {
    this.toastService.remove(id);
  }

  iconFor(type: ToastMessage['type']): string {
    switch (type) {
      case 'success': return 'fa fa-check-circle text-success';
      case 'error': return 'fa fa-times-circle text-danger';
      case 'warning': return 'fa fa-exclamation-triangle text-warning';
      default: return 'fa fa-info-circle text-info';
    }
  }
}

