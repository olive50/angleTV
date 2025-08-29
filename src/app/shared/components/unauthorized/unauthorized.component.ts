import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-unauthorized',
  template: `
    <div class="error-container">
      <div class="error-content">
        <div class="error-icon">
          <i class="fas fa-ban"></i>
        </div>
        <h1 class="error-title">Access Denied</h1>
        <p class="error-message">
          You don't have permission to access this resource.
        </p>
        <div class="error-actions">
          <button class="btn btn-primary" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
            Go Back
          </button>
          <button class="btn btn-secondary" (click)="goToDashboard()">
            <i class="fas fa-home"></i>
            Dashboard
          </button>
        </div>
        <div class="user-info" *ngIf="currentUser">
          <p>
            Logged in as:
            <strong
              >{{ currentUser.firstName }} {{ currentUser.lastName }}</strong
            >
          </p>
          <p>
            Role: <strong>{{ currentUser.role }}</strong>
          </p>
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
        color: var(--danger-color);
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
        margin-bottom: 30px;
      }
      .user-info {
        background: var(--gray-100);
        padding: 16px;
        border-radius: 8px;
        font-size: 14px;
        color: var(--gray-700);
      }
      @media (max-width: 480px) {
        .error-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class UnauthorizedComponent {
  currentUser = this.authService.getCurrentUserValue();

  constructor(private router: Router, private authService: JwtAuthService) {}

  goBack(): void {
    window.history.back();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
