// src/app/core/services/base-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, retry, timer } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected apiUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  protected get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, { params })
      .pipe(
        timeout(environment.api.timeout),
        retry({
          count: environment.api.retryAttempts,
          delay: (error, retryCount) => timer(retryCount * 1000)
        }),
        map(response => response.data),
        catchError(this.handleError.bind(this))
      );
  }

  protected getPagedData<T>(endpoint: string, params?: HttpParams): Observable<PagedApiResponse<T>['data']> {
    return this.http.get<PagedApiResponse<T>>(`${this.apiUrl}${endpoint}`, { params })
      .pipe(
        timeout(environment.api.timeout),
        retry({
          count: environment.api.retryAttempts,
          delay: (error, retryCount) => timer(retryCount * 1000)
        }),
        map(response => response.data),
        catchError(this.handleError.bind(this))
      );
  }

  protected post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, data)
      .pipe(
        timeout(environment.api.timeout),
        map(response => response.data),
        catchError(this.handleError.bind(this))
      );
  }

  protected put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, data)
      .pipe(
        timeout(environment.api.timeout),
        map(response => response.data),
        catchError(this.handleError.bind(this))
      );
  }

  protected delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.apiUrl}${endpoint}`)
      .pipe(
        timeout(environment.api.timeout),
        map(response => response.data),
        catchError(this.handleError.bind(this))
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Bad Request';
          break;
        case 401:
          errorMessage = 'Unauthorized - Please log in';
          break;
        case 403:
          errorMessage = 'Access forbidden';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 500:
          errorMessage = 'Internal server error';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
      }
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}