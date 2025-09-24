// src/app/auth/components/login/login.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  returnUrl = '/dashboard';
  showPassword = false;
  loginAttempts = 0;
  maxAttempts = 3;
  isBlocked = false;
  blockTimeRemaining = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: JwtAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit(): void {
    // Get return URL from route parameters or default to dashboard
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Check if redirected due to token expiry
    const reason = this.route.snapshot.queryParams['reason'];
    if (reason === 'expired') {
      this.error = 'Your session has expired. Please log in again.';
    }

    // Listen to loading state
    this.authService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => (this.isLoading = loading));

    // Check if user is already logged in
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          this.router.navigate([this.returnUrl]);
        }
      });

    // Load saved credentials if any
    this.loadSavedCredentials();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createLoginForm(): FormGroup {
    return this.formBuilder.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading || this.isBlocked) {
      this.markFormGroupTouched();
      return;
    }

    const credentials = {
      username: this.loginForm.get('username')?.value.trim(),
      password: this.loginForm.get('password')?.value,
    };

    this.error = null;

    this.authService
      .login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Login successful:', response);

          // Save credentials if remember me is checked
          if (this.loginForm.get('rememberMe')?.value) {
            this.saveCredentials(credentials.username);
          } else {
            this.clearSavedCredentials();
          }

          // Reset login attempts
          this.loginAttempts = 0;

          // Navigate to return URL or dashboard
          this.router.navigate([this.returnUrl]);
        },
        error: (error: HttpErrorResponse) => {
          // Delegate to centralized handler to increment attempts/block and set message
          this.handleLoginError(error);
        },
      });
  }

  private handleLoginError(error: any): void {
    console.log('=== FULL ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error status:', error.status);
    console.log('Error statusText:', error.statusText);
    console.log('Error body:', error.error);
    console.log('Error message:', error.message);
    console.log('Error error.message:', error.error?.message);
    console.log('Type of error.error:', typeof error.error);
    console.log('========================');

    // Do NOT count attempts or block when server is offline
    if (error instanceof HttpErrorResponse && error.status === 0) {
      this.error = 'Server is offline.';
      return;
    }

    this.loginAttempts++;

    // Handle HTTP error responses properly
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
          // Authentication failed - extract message from backend
          if (error.error && error.error.message) {
            this.error = error.error.message;
          } else {
            this.error = 'Invalid username or password';
          }
          break;

        case 400:
          // Bad request - validation errors
          if (error.error && error.error.message) {
            this.error = error.error.message;
          } else if (error.error && error.error.validationErrors) {
            // Handle validation errors from your GlobalExceptionHandler
            const validationErrors = error.error.validationErrors;
            const errorMessages = validationErrors.map(
              (err: any) => err.message
            );
            this.error = errorMessages.join(', ');
          } else {
            this.error = 'Please check your input and try again.';
          }
          break;

        case 403:
          this.error = 'Access denied. Please contact your administrator.';
          break;

        case 500:
          // Map credential-like 500s to friendly message
          const backendMessage = String(
            error?.error?.message || ''
          ).toLowerCase();
          const looksLikeBadCreds =
            backendMessage.includes('bad credential') ||
            backendMessage.includes('invalid credential') ||
            backendMessage.includes('invalid username') ||
            backendMessage.includes('invalid password') ||
            backendMessage.includes('user not found') ||
            backendMessage.includes('authentication failed') ||
            backendMessage.includes('unauthorized');
          if (looksLikeBadCreds) {
            this.error = 'Invalid username or password';
          } else if (error.error && error.error.message) {
            this.error = error.error.message;
          } else {
            this.error =
              'Server error. Please try again later or contact support.';
          }
          break;

        default:
          this.error = `Unexpected error (${error.status}). Please try again.`;
      }
    } else {
      // Fallback for any other error types
      this.error = 'Invalid username or password';
    }

    console.log('Final error message set to:', this.error);

    // Block login attempts after max attempts
    if (this.loginAttempts >= this.maxAttempts) {
      this.blockLogin();
      return;
    }

    // Focus on username field for retry (only if not blocked)
    if (!this.isBlocked) {
      setTimeout(() => {
        const usernameField = document.getElementById('username');
        if (usernameField) {
          usernameField.focus();
        }
      }, 100);
    }
  }

  private blockLogin(): void {
    this.isBlocked = true;
    this.blockTimeRemaining = 30; // 30 seconds block time
    this.error = `Too many failed attempts. Please wait ${this.blockTimeRemaining} seconds before trying again.`;

    const interval = setInterval(() => {
      this.blockTimeRemaining--;

      if (this.blockTimeRemaining > 0) {
        this.error = `Too many failed attempts. Please wait ${this.blockTimeRemaining} seconds before trying again.`;
      } else {
        // Reset everything
        this.isBlocked = false;
        this.loginAttempts = 0;
        this.error = null;
        clearInterval(interval);

        // Focus on username field after unblocking
        setTimeout(() => {
          const usernameField = document.getElementById('username');
          if (usernameField) {
            usernameField.focus();
          }
        }, 100);
      }
    }, 1000);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  private saveCredentials(username: string): void {
    localStorage.setItem('remembered_username', username);
  }

  private loadSavedCredentials(): void {
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      this.loginForm.patchValue({
        username: savedUsername,
        rememberMe: true,
      });
    }
  }

  private clearSavedCredentials(): void {
    localStorage.removeItem('remembered_username');
  }

  // Getter methods for template
  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get isFormValid(): boolean {
    return this.loginForm.valid && !this.isLoading && !this.isBlocked;
  }

  // Helper method to get error class for styling
  get errorClass(): string {
    if (!this.error) return '';

    if (
      this.error.includes('Unable to connect') ||
      this.error.includes('Connection timeout') ||
      this.error.includes('Connection failed') ||
      this.error.includes('Server is temporarily unavailable')
    ) {
      return 'error-network';
    } else if (this.error.includes('Server error')) {
      return 'error-server';
    } else if (this.error.includes('Too many failed attempts')) {
      return 'error-blocked';
    } else {
      return 'error-auth';
    }
  }

  // Quick login for demo purposes (remove in production)
  quickLogin(role: string): void {
    if (this.isBlocked) {
      return; // Don't allow quick login when blocked
    }

    const credentials = {
      admin: { username: 'admin', password: 'admin123' },
      manager: { username: 'manager', password: 'admin123' },
      receptionist: { username: 'receptionist', password: 'admin123' },
      technician: { username: 'technician', password: 'admin123' },
      housekeepeer: { username: 'housekeepeer', password: 'admin123' },
    };

    const cred = credentials[role as keyof typeof credentials];
    if (cred) {
      this.loginForm.patchValue(cred);
      // Clear any existing errors
      this.error = null;
    }
  }

  // Method to clear errors (useful for template)
  clearError(): void {
    this.error = null;
  }
}
