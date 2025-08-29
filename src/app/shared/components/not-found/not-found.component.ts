import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  template: `
    <div class="error-container">
      <div class="error-content">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h1 class="error-title">404 - Page Not Found</h1>
        <p class="error-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="error-actions">
          <button class="btn btn-primary" (click)="goHome()">
            <i class="fas fa-home"></i>
            Go Home
          </button>
          <button class="btn btn-secondary" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
            Go Back
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .error-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
        background: var(--gray-50);
      }
      .error-content {
        text-align: center;
        max-width: 500px;
      }
      .error-icon {
        font-size: 80px;
        color: var(--warning-color);
        margin-bottom: 20px;
      }
      .error-title {
        font-size: 32px;
        font-weight: 700;
        color: var(--gray-900);
        margin-bottom: 16px;
      }
      .error-message {
        font-size: 16px;
        color: var(--gray-600);
        margin-bottom: 30px;
      }
      .error-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      @media (max-width: 480px) {
        .error-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    window.history.back();
  }
}
