// src/app/core/services/jwt-auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  type: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  avatar?: string;
}

@Injectable({
  providedIn: 'root',
})
export class JwtAuthService {
  private apiUrl = environment.apiUrl || 'http://localhost:8080/api';
  private tokenKey = 'jwt_token';
  private userKey = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeAuth(): void {
    const token = this.getToken();
    const storedUser = localStorage.getItem(this.userKey);

    if (token && storedUser && this.isTokenValid(token)) {
      try {
        const user: User = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        console.log('Auth initialized for user:', user.username);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.logout();
      }
    } else {
      this.clearAuthData();
    }
  }

  /**
   * Login user with credentials
   */
  login(credentials: LoginRequest): Observable<JwtResponse> {
    this.isLoadingSubject.next(true);

    return this.http
      .post<JwtResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          console.log('Login successful:', response);
          this.handleAuthSuccess(response);
        }),
        catchError((error: HttpErrorResponse) => {
          console.log('Auth service - Raw error:', error);
          console.log('Auth service - Error status:', error.status);
          console.log('Auth service - Error message:', error.message);
          console.log('Auth service - Error name:', error.name);
          
          // DON'T transform the error - pass through the exact HttpErrorResponse
          // This preserves all error information including status 0 for network errors
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoadingSubject.next(false);
        })
      );
  }

  /**
   * Logout current user
   */
  logout(): void {
    console.log('Logging out user');
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  /**
   * Get current user info from API
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      tap((user) => {
        console.log('Current user fetched:', user);
        this.updateCurrentUser(user);
      }),
      catchError((error) => {
        console.error('Failed to get current user:', error);
        this.logout();
        return throwError(error);
      })
    );
  }

  /**
   * Refresh user data
   */
  refreshUser(): Observable<User> {
    return this.getCurrentUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && this.isTokenValid(token);
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get current user value (synchronous)
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if current user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUserValue();
    return user ? user.role === role : false;
  }

  /**
   * Check if current user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUserValue();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: JwtResponse): void {
    // Store token
    localStorage.setItem(this.tokenKey, response.token);

    // Create user object
    const user: User = {
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
      isActive: response.isActive,
      avatar: 'assets/images/user.svg',
    };

    // Store user data
    localStorage.setItem(this.userKey, JSON.stringify(user));

    // Update subjects
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);

    console.log('Authentication successful for:', user.username);
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Update current user data
   */
  private updateCurrentUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Basic token validation (check if not expired)
   */
  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  /**
   * Get token expiration date
   */
  getTokenExpirationDate(): Date | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  /**
   * Check if token is about to expire (within 5 minutes)
   */
  isTokenAboutToExpire(): boolean {
    const expirationDate = this.getTokenExpirationDate();
    if (!expirationDate) return true;

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expirationDate < fiveMinutesFromNow;
  }
}