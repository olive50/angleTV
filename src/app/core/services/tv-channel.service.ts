// UPDATED tv-channel.service.ts (relevant parts)
import { inject, Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  TvChannel,
  TvChannelCreateRequest,
  TvChannelUpdateRequest,
  PagedResponse,
  ChannelFilters,
} from '../models/tv-channel.model';

@Injectable({
  providedIn: 'root',
})
export class TvChannelService {
  private readonly apiUrl = `${environment.apiUrl}/channels`;

  private http = inject(HttpClient); //constructor(private http: HttpClient) {}

  private channelsSubject = new BehaviorSubject<TvChannel[]>([]);
  public channels$ = this.channelsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Cache management
  private channelsCache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // filters: ChannelFilters = {};

  // constructor(private http: HttpClient) {}

  /**
   * Get all channels (cached)
   */
  getAllChannels(forceRefresh = false): Observable<TvChannel[]> {
    const cacheKey = 'all_channels';

    if (!forceRefresh && this.channelsCache.has(cacheKey)) {
      const cached = this.channelsCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.channelsSubject.next(cached.data);
        return of(cached.data);
      }
    }

    this.setLoading(true);
    this.clearError();

    return this.http.get<TvChannel[]>(this.apiUrl).pipe(
      tap((channels) => {
        this.channelsSubject.next(channels);
        this.channelsCache.set(cacheKey, {
          data: channels,
          timestamp: Date.now(),
        });
        this.setLoading(false);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Get paginated channels
   */
  getChannelsPaged(
    page = 0,
    size = 20,
    sortBy = 'channelNumber',
    sortDir = 'asc',
    filters?: ChannelFilters
  ): Observable<PagedResponse<TvChannel>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortBy},${sortDir}`);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.categoryId)
        params = params.set('categoryId', filters.categoryId.toString());
      if (filters.languageId)
        params = params.set('languageId', filters.languageId.toString());
      if (filters.isActive !== undefined)
        params = params.set('isActive', filters.isActive.toString());
    }

    this.setLoading(true);
    this.clearError();

    return this.http
      .get<PagedResponse<TvChannel>>(`${this.apiUrl}/paged`, { params })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get channel by ID
   */
  getChannelById(id: number): Observable<TvChannel> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<TvChannel>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.setLoading(false)),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Create new channel WITHOUT logo
   */
  createChannel(channel: TvChannelCreateRequest): Observable<TvChannel> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<TvChannel>(this.apiUrl, channel).pipe(
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshChannelsList();
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Create new channel WITH logo file
   */
  createChannelWithLogo(
    channel: TvChannelCreateRequest,
    logoFile: File
  ): Observable<TvChannel> {
    this.setLoading(true);
    this.clearError();

    const formData = new FormData();

    // Append channel data as JSON blob
    const channelBlob = new Blob([JSON.stringify(channel)], {
      type: 'application/json',
    });
    formData.append('channel', channelBlob);

    // Append logo file
    formData.append('logo', logoFile, logoFile.name);

    return this.http.post<TvChannel>(`${this.apiUrl}/with-logo`, formData).pipe(
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshChannelsList();
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Update existing channel WITHOUT logo
   */
  updateChannel(
    id: number,
    channel: TvChannelUpdateRequest
  ): Observable<TvChannel> {
    this.setLoading(true);
    this.clearError();

    return this.http.put<TvChannel>(`${this.apiUrl}/${id}`, channel).pipe(
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshChannelsList();
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Update existing channel WITH logo file (or keep existing logo)
   */
  updateChannelWithLogo(
    id: number,
    channel: TvChannelUpdateRequest,
    logoFile?: File
  ): Observable<TvChannel> {
    this.setLoading(true);
    this.clearError();

    const formData = new FormData();

    // Append channel data as JSON blob
    const channelBlob = new Blob([JSON.stringify(channel)], {
      type: 'application/json',
    });
    formData.append('channel', channelBlob);

    // Append logo file if provided (optional for updates)
    if (logoFile) {
      formData.append('logo', logoFile, logoFile.name);
    }

    return this.http
      .put<TvChannel>(`${this.apiUrl}/${id}/with-logo`, formData)
      .pipe(
        tap(() => {
          this.clearCache();
          this.setLoading(false);
          this.refreshChannelsList();
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get logo URL for a channel
   */
  getLogoUrl(id: number): string {
    return `${this.apiUrl}/${id}/logo`;
  }

  /**
   * Delete channel
   */
  deleteChannel(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshChannelsList();
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Search channels
   */
  searchChannels(
    query: string,
    page = 0,
    size = 20
  ): Observable<PagedResponse<TvChannel>> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('size', size.toString());

    this.setLoading(true);
    this.clearError();

    return this.http
      .get<PagedResponse<TvChannel>>(`${this.apiUrl}/search`, { params })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get channels by category
   */
  getChannelsByCategory(categoryId: number): Observable<TvChannel[]> {
    return this.http
      .get<TvChannel[]>(`${this.apiUrl}/category/${categoryId}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Get channels by language
   */
  getChannelsByLanguage(languageId: number): Observable<TvChannel[]> {
    return this.http
      .get<TvChannel[]>(`${this.apiUrl}/language/${languageId}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Validate IP and Port connectivity
   */
  testChannelConnectivity(
    ip: string,
    port: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(
        `${this.apiUrl}/test-connectivity`,
        { ip, port }
      )
      .pipe(
        catchError((error) => {
          console.error('Connectivity test failed:', error);
          return of({
            success: false,
            message: 'Unable to test connectivity',
          });
        })
      );
  }

  /**
   * Bulk operations
   */
  bulkDeleteChannels(channelIds: number[]): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/bulk-delete`, { channelIds })
      .pipe(
        tap(() => {
          this.clearCache();
          this.refreshChannelsList();
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Import channels from file
   */
  importChannels(
    file: File
  ): Observable<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<{ success: number; errors: string[] }>(
        `${this.apiUrl}/import`,
        formData
      )
      .pipe(
        tap(() => {
          this.clearCache();
          this.refreshChannelsList();
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Export channels to CSV/Excel
   */
  exportChannels(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/export/${format}`, {
        responseType: 'blob',
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Get channel statistics
   */
  getChannelStats(): Observable<{
    total: number;
    active: number;
    byCategory: { [category: string]: number };
    byLanguage: { [language: string]: number };
  }> {
    return this.http
      .get<any>(`${this.apiUrl}/stats`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // Utility methods
  clearCache(): void {
    this.channelsCache.clear();
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  refreshChannelsList(): void {
    this.getAllChannels(true).subscribe();
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
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
