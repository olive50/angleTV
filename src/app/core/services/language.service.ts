import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { Language } from '../models/language.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private apiUrl = 'http://localhost:8080/api/languages';

   // State management
   private languagesSubject = new BehaviorSubject<Language[]>([]);
   public languages$ = this.languagesSubject.asObservable();

   private loadingSubject = new BehaviorSubject<boolean>(false);
   public loading$ = this.loadingSubject.asObservable();
 
   private errorSubject = new BehaviorSubject<string | null>(null);
   public error$ = this.errorSubject.asObservable();
   

  constructor(private http: HttpClient) {}

  getAllLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>(`${this.apiUrl}/admin`);
  }

  /**
   * Get admin languages - matches GET /api/languages/admin
/**
 * Get admin languages - matches GET /api/languages/admin
 */
getAdminLanguages(): Observable<Language[]> {
  return this.http.get<ApiResponse<Language[]>>(`${this.apiUrl}/admin`)
    .pipe(
      map(response => response.data),
      tap(languages => {
        // This still updates the subject, which is a good practice for state management
        this.languagesSubject.next(languages); 
      }),
      catchError(this.handleError.bind(this))
    );
}

//   // In tv-channel.service.ts
//   getAllLanguages(): Observable<any[]> {
//   return this.http.get<any>(this.apiUrl).pipe(
//     map(response => {
//       // Extract the content array
//       return response.content || [];
//     }),
//     catchError(error => {
//       console.error('Error fetching channels:', error);
//       return of([]);
//     })
//   );
// }

  getLanguageById(id: number): Observable<Language> {
    return this.http.get<Language>(`${this.apiUrl}/${id}`);
  }

  createLanguage(language: Language): Observable<Language> {
    return this.http.post<Language>(this.apiUrl, language);
  }

  updateLanguage(id: number, language: Language): Observable<Language> {
    return this.http.put<Language>(`${this.apiUrl}/${id}`, language);
  }

  deleteLanguage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

   // ERROR HANDLING
  // ===================================================================

  // private handleError(error: HttpErrorResponse): Observable<never> {
  //   console.error('Language API Error:', error);
  //   this.setLoading(false);
    
  //   let errorMessage = 'An unexpected error occurred';
    
  //   if (error.error instanceof ErrorEvent) {
  //     // Client-side error
  //     errorMessage = `Client Error: ${error.error.message}`;
  //   } else {
  //     // Server-side error
  //     if (error.error && typeof error.error === 'object') {
  //       if (error.error.message) {
  //         errorMessage = error.error.message;
  //       } else {
  //         errorMessage = `HTTP Error: ${error.status} - ${error.statusText}`;
  //       }
  //     } else {
  //       errorMessage = `HTTP Error: ${error.status} - ${error.statusText}`;
  //     }
  //   }
    
  //   this.setError(errorMessage);
  //   return throwError(() => new Error(errorMessage));
  // }
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
  private setError(error: string): void {
    this.errorSubject.next(error);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
      console.error('API Error:', error);
      this.setLoading(false);
      
      let errorMessage = 'An error occurred';
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        errorMessage = error.error?.message || `Error Code: ${error.status}`;
      }
      
      this.setError(errorMessage);
      return throwError(() => new Error(errorMessage));
    }

}
