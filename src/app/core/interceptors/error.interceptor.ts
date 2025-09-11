// src/app/core/interceptors/error.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Log for diagnostics but preserve the original HttpErrorResponse
        console.error('HTTP Error:', error);

        // IMPORTANT: Do not transform the error; rethrow it unchanged so callers
        // (like the login component) can reliably inspect status and error payload
        return throwError(() => error);
      })
    );
  }
}
