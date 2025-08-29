// src/app/auth/components/login/login.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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

    // Load saved username if any
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
        error: (error) => {
          console.error('Login failed:', error);
          this.handleLoginError(error);
        },
      });
  }

  private handleLoginError(error: any): void {
    this.loginAttempts++;

    if (error.message) {
      this.error = error.message;
    } else {
      this.error = 'Login failed. Please check your credentials and try again.';
    }

    // Block login attempts after max attempts
    if (this.loginAttempts >= this.maxAttempts) {
      this.blockLogin();
    }

    // Focus on username field for retry
    setTimeout(() => {
      const usernameField = document.getElementById('username');
      if (usernameField) {
        usernameField.focus();
      }
    }, 100);
  }

  private blockLogin(): void {
    this.isBlocked = true;
    this.blockTimeRemaining = 300; // 5 minutes
    this.error = `Too many failed attempts. Please wait ${this.blockTimeRemaining} seconds.`;

    const interval = setInterval(() => {
      this.blockTimeRemaining--;
      this.error = `Too many failed attempts. Please wait ${this.blockTimeRemaining} seconds.`;

      if (this.blockTimeRemaining <= 0) {
        this.isBlocked = false;
        this.loginAttempts = 0;
        this.error = null;
        clearInterval(interval);
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

  // Quick login for demo purposes (remove in production)
  quickLogin(role: string): void {
    const credentials = {
      admin: { username: 'admin', password: 'admin123' },
      manager: { username: 'manager', password: 'admin123' },
      receptionist: { username: 'receptionist', password: 'admin123' },
      technician: { username: 'technician', password: 'admin123' },
    };

    const cred = credentials[role as keyof typeof credentials];
    if (cred) {
      this.loginForm.patchValue(cred);
    }
  }
}
