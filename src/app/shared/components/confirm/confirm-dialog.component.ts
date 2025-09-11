import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfirmService, ConfirmState } from './confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div *ngIf="(state$ | async) as state" class="confirm-overlay" (click)="onBackdrop(state.id)">
      <div class="confirm-dialog" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <h3 class="confirm-title">{{ state.title }}</h3>
        <p class="confirm-message">{{ state.message }}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" (click)="onCancel(state.id)">{{ state.cancelText || 'Cancel' }}</button>
          <button class="btn btn-danger" (click)="onConfirm(state.id)">{{ state.confirmText || 'Confirm' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 2100; }
    .confirm-dialog { width: 100%; max-width: 420px; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-xl); padding: 20px; }
    .confirm-title { margin: 0 0 8px; font-size: 18px; color: var(--gray-900); }
    .confirm-message { margin: 0 0 16px; color: var(--gray-700); font-size: 14px; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
    `
  ]
})
export class ConfirmDialogComponent {
  state$: Observable<ConfirmState | null> = this.confirmService.state$;

  constructor(private confirmService: ConfirmService) {}

  onBackdrop(id: string) { this.confirmService.cancel(id); }
  onCancel(id: string) { this.confirmService.cancel(id); }
  onConfirm(id: string) { this.confirmService.confirm(id); }
}

