import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  tap,
  throwError,
} from 'rxjs';
import { Language } from '../models/language.model';

// Interface pour la réponse de l'API
interface TvBootHttpResponse<T = any> {
  timeStamp: string;
  statusCode: number;
  status: string;
  reason: string;
  message: string;
  data: T;
  pagination?: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

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

  // GET /api/languages - Get all languages with pagination
  getAllLanguages(
    page: number = 0,
    size: number = 20
  ): Observable<{
    languages: Language[];
    pagination: any;
  }> {
    this.setLoading(true);
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<TvBootHttpResponse>(`${this.apiUrl}`, { params }).pipe(
      map((response) => ({
        languages: response.data.languages || [],
        pagination: response.pagination,
      })),
      tap((data) => this.languagesSubject.next(data.languages)),
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
  }

  // GET /api/languages/admin - Get admin enabled languages
  getAdminLanguages(
    page: number = 0,
    size: number = 20
  ): Observable<{
    languages: Language[];
    pagination: any;
  }> {
    this.setLoading(true);
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/admin`, { params })
      .pipe(
        map((response) => ({
          languages: response.data.languages || [],
          pagination: response.pagination,
        })),
        tap((data) => this.languagesSubject.next(data.languages)),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  // GET /api/languages/guest - Get guest enabled languages
  getGuestLanguages(
    page: number = 0,
    size: number = 20
  ): Observable<{
    languages: Language[];
    pagination: any;
  }> {
    this.setLoading(true);
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/guest`, { params })
      .pipe(
        map((response) => ({
          languages: response.data.languages || [],
          pagination: response.pagination,
        })),
        tap((data) => this.languagesSubject.next(data.languages)),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  // GET /api/languages/search - Search languages with filters
  searchLanguages(
    searchQuery: string = '',
    isAdminEnabled?: boolean,
    isGuestEnabled?: boolean,
    isRtl?: boolean,
    page: number = 0,
    size: number = 20
  ): Observable<{
    languages: Language[];
    pagination: any;
    searchQuery: string;
    resultsFound: number;
  }> {
    this.setLoading(true);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('q', searchQuery);

    if (isAdminEnabled !== undefined && isAdminEnabled !== null) {
      params = params.set('isAdminEnabled', isAdminEnabled.toString());
    }
    if (isGuestEnabled !== undefined && isGuestEnabled !== null) {
      params = params.set('isGuestEnabled', isGuestEnabled.toString());
    }
    if (isRtl !== undefined && isRtl !== null) {
      params = params.set('isRtl', isRtl.toString());
    }

    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/search`, { params })
      .pipe(
        map((response) => ({
          languages: response.data.languages || [],
          pagination: response.pagination,
          searchQuery: response.data.searchQuery || '',
          resultsFound: response.data.resultsFound || 0,
        })),
        tap((data) => this.languagesSubject.next(data.languages)),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  // GET /api/languages/{id} - Get language by ID
  getLanguageById(id: number): Observable<Language> {
    this.setLoading(true);
    return this.http.get<TvBootHttpResponse>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data.language),
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
  }

  // GET /api/languages/iso/{iso6391} - Get language by ISO code
  getLanguageByIso(iso6391: string): Observable<Language> {
    this.setLoading(true);
    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/iso/${iso6391}`)
      .pipe(
        map((response) => response.data.language),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  // POST /api/languages - Create language
  createLanguage(language: any): Observable<Language> {
    this.setLoading(true);
    return this.http.post<TvBootHttpResponse>(this.apiUrl, language).pipe(
      map((response) => response.data.language),
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
  }

  // POST /api/languages/with-flag - Create language with flag
  createLanguageWithFlag(language: any, flagFile: File): Observable<Language> {
    this.setLoading(true);
    const formData = new FormData();
    formData.append(
      'language',
      new Blob([JSON.stringify(language)], { type: 'application/json' })
    );
    formData.append('flag', flagFile);

    return this.http
      .post<TvBootHttpResponse>(`${this.apiUrl}/with-flag`, formData)
      .pipe(
        map((response) => response.data.language),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  // PUT /api/languages/{id} - Update language
  updateLanguage(id: number, language: any): Observable<Language> {
    this.setLoading(true);
    return this.http
      .put<TvBootHttpResponse>(`${this.apiUrl}/${id}`, language)
      .pipe(
        map((response) => response.data.language),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  // PUT /api/languages/{id}/with-flag - Update language with flag
  updateLanguageWithFlag(
    id: number,
    language: any,
    flagFile?: File
  ): Observable<Language> {
    this.setLoading(true);
    const formData = new FormData();
    formData.append(
      'language',
      new Blob([JSON.stringify(language)], { type: 'application/json' })
    );
    if (flagFile) {
      formData.append('flag', flagFile);
    }

    return this.http
      .put<TvBootHttpResponse>(`${this.apiUrl}/${id}/with-flag`, formData)
      .pipe(
        map((response) => response.data.language),
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  // DELETE /api/languages/{id} - Delete language
  deleteLanguage(id: number): Observable<void> {
    this.setLoading(true);
    return this.http.delete<TvBootHttpResponse>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0),
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
  }

  // GET /api/languages/stats - Get language statistics
  getLanguageStats(): Observable<any> {
    this.setLoading(true);
    return this.http.get<TvBootHttpResponse>(`${this.apiUrl}/stats`).pipe(
      map((response) => ({
        total: response.data.total,
        adminEnabled: response.data.adminEnabled,
        guestEnabled: response.data.guestEnabled,
        rtlLanguages: response.data.rtlLanguages,
        byCharset: response.data.byCharset,
        byCurrency: response.data.byCurrency,
      })),
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
  }

  // Helper method: Get all languages as a simple array (for dropdowns, selects, etc.)
  getAllLanguagesSimple(): Observable<Language[]> {
    return this.getAllLanguages().pipe(map((response) => response.languages));
  }

  // Helper method: Get admin languages as a simple array
  getAdminLanguagesSimple(): Observable<Language[]> {
    return this.getAdminLanguages().pipe(map((response) => response.languages));
  }

  // Helper method: Get guest languages as a simple array
  getGuestLanguagesSimple(): Observable<Language[]> {
    return this.getGuestLanguages().pipe(map((response) => response.languages));
  }

  // Helper methods
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Language API Error:', error);
    this.setLoading(false);

    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && typeof error.error === 'object') {
        errorMessage =
          error.error.message ||
          error.error.developerMessage ||
          `HTTP Error: ${error.status} - ${error.statusText}`;
      } else {
        errorMessage = `HTTP Error: ${error.status} - ${error.statusText}`;
      }
    }

    this.setError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
