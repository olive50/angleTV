// src/app/core/interceptors/jwt.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { JwtAuthService } from '../services/jwt-auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  constructor(private authService: JwtAuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Skip interceptor for auth endpoints
    if (this.isAuthEndpoint(request.url)) {
      return next.handle(request);
    }

    // Add JWT token to request if available
    const authRequest = this.addTokenToRequest(request);

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 errors (unauthorized)
        if (error.status === 401 && !this.isAuthEndpoint(request.url)) {
          return this.handle401Error(authRequest, next);
        }

        // Handle 403 errors (forbidden)
        if (error.status === 403) {
          console.warn('Access denied (403):', error);
        }

        return throwError(error);
      })
    );
  }

  /**
   * Add JWT token to request headers
   */
  private addTokenToRequest(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getToken();

    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return request;
  }

  /**
   * Check if the request is for authentication endpoints
   */
  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = [
      '/auth/login',
      '/auth/register',
      '/test/public',
      '/test/health',
    ];

    return authEndpoints.some((endpoint) => url.includes(endpoint));
  }

  /**
   * Handle 401 unauthorized errors
   */
  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.warn('Received 401 error, logging out user');

    // For now, just logout the user
    // In a more complex setup, you might want to implement token refresh
    this.authService.logout();

    return throwError('Session expired. Please log in again.');
  }

  /**
   * Handle token refresh (for future implementation)
   */
  private handleTokenRefresh(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Here you would implement token refresh logic
      // For now, just logout
      this.authService.logout();
      this.isRefreshing = false;

      return throwError('Session expired');
    } else {
      // Wait for refresh to complete
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap(() => next.handle(this.addTokenToRequest(request)))
      );
    }
  }
}
