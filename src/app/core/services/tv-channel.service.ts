// Updated tv-channel.service.ts to work with TvBootHttpResponse
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

// Add this interface to match your backend response
interface TvBootHttpResponse {
  timeStamp: string;
  statusCode: number;
  status: string;
  reason: string;
  message: string;
  data: {
    pagination?: {
      total?: number;
      size?: number;
      totalPages?: number;
      hasPrevious?: boolean;
      hasNext?: boolean;
      page?: number;
    };
    channels?: TvChannel[];
    channel?: TvChannel;
    count?: number;
    total?: number;
    active?: number;
    inactive?: number;
    byCategory?: { [key: string]: number };
    byLanguage?: { [key: string]: number };
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TvChannelService {
  private readonly apiUrl = `${environment.apiUrl}/channels`;

  private http = inject(HttpClient);

  private channelsSubject = new BehaviorSubject<TvChannel[]>([]);
  public channels$ = this.channelsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Cache management
  private channelsCache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

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

    return this.http.get<TvBootHttpResponse>(this.apiUrl).pipe(
      map((response) => response.data.channels || []),
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
   * Get paginated channels - Updated for new backend format
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
      .set('size', size.toString());

    if (filters) {
      if (filters.search) params = params.set('q', filters.search);
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
      .get<TvBootHttpResponse>(this.apiUrl + '/search', { params })
      .pipe(
        map((response) => {
          // Handle the actual response structure from your backend
          const data = response.data || {};
          const pagination = data.pagination || {};
          const channels = data.channels || [];

          // Access pagination properties safely with optional chaining
          const totalElements = pagination.total || channels.length;
          const totalPages = pagination.totalPages || 1;
          const currentPage = pagination.page || 0;
          const pageSize = pagination.size || size;

          return {
            content: channels,
            pageable: {
              pageNumber: currentPage,
              pageSize: pageSize,
              sort: {
                empty: true,
                sorted: false,
                unsorted: true,
              },
              offset: currentPage * pageSize,
              paged: true,
              unpaged: false,
            },
            last: !(pagination.hasNext || false),
            totalPages: totalPages,
            totalElements: totalElements,
            size: pageSize,
            number: currentPage,
            sort: {
              empty: true,
              sorted: false,
              unsorted: true,
            },
            first: !(pagination.hasPrevious || false),
            numberOfElements: channels.length,
            empty: channels.length === 0,
          } as PagedResponse<TvChannel>;
        }),
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

    return this.http.get<TvBootHttpResponse>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data.channel as TvChannel),
      tap(() => this.setLoading(false)),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Get channel by number
   */
  getChannelByNumber(channelNumber: number): Observable<TvChannel> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/number/${channelNumber}`)
      .pipe(
        map((response) => response.data.channel as TvChannel),
        tap(() => this.setLoading(false)),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get channel by ID for duplication (returns modified channel data for new channel)
   */
  getChannelForDuplication(id: number): Observable<TvChannel> {
    return this.getChannelById(id).pipe(
      map((channel) => {
        // Create a modified copy for duplication
        const duplicatedChannel: TvChannel = {
          ...channel,
          id: undefined, // Remove ID for new channel
          channelNumber: this.suggestNewChannelNumber(channel.channelNumber),
          name: `${channel.name} (Copy)`, // Add copy suffix
          port: (channel.port || 8000) + 1, // Increment port by 1
          createdAt: undefined,
          updatedAt: undefined,
          logoPath: undefined, // Clear logo path for new channel
          // Keep logoUrl if it exists (URL-based logos can be inherited)
        };

        return duplicatedChannel;
      })
    );
  }

  /**
   * Suggest a new channel number for duplication
   */
  private suggestNewChannelNumber(originalNumber: number): number {
    // Simple logic - in a real app you might want to check with backend for availability
    let newNumber = originalNumber + 1;

    // If too close to original, add 100 to create more separation
    if (newNumber - originalNumber < 10) {
      newNumber = originalNumber + 100;
    }

    // Ensure it's within valid range
    if (newNumber > 9999) {
      newNumber = originalNumber + 1;
    }

    return newNumber;
  }

  /**
   * Create new channel WITHOUT logo
   */
  createChannel(channel: TvChannelCreateRequest): Observable<TvChannel> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<TvBootHttpResponse>(this.apiUrl, channel).pipe(
      map((response) => response.data.channel as TvChannel),
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

    return this.http
      .put<TvBootHttpResponse>(`${this.apiUrl}/${id}`, channel)
      .pipe(
        map((response) => response.data.channel as TvChannel),
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

    return this.http.delete<TvBootHttpResponse>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0), // Transform to void
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
      .get<TvBootHttpResponse>(`${this.apiUrl}/search`, { params })
      .pipe(
        map((response) => {
          // Transform TvBootHttpResponse to PagedResponse format
          const pagination = response.data.pagination;
          const channels = response.data.channels || [];

          return {
            content: channels,
            pageable: {
              pageNumber: pagination?.page || 0,
              pageSize: pagination?.size || size,
              sort: {
                empty: true,
                sorted: false,
                unsorted: true,
              },
              offset: (pagination?.page || 0) * (pagination?.size || size),
              paged: true,
              unpaged: false,
            },
            last: !(pagination?.hasNext || false),
            totalPages: pagination?.totalPages || 1,
            totalElements: pagination?.total || 0,
            size: pagination?.size || size,
            number: pagination?.page || 0,
            sort: {
              empty: true,
              sorted: false,
              unsorted: true,
            },
            first: !(pagination?.hasPrevious || false),
            numberOfElements: channels.length,
            empty: channels.length === 0,
          } as PagedResponse<TvChannel>;
        }),
        tap(() => this.setLoading(false)),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get channels by category
   */
  getChannelsByCategory(
    category: string, // Changed from categoryId to category name
    page = 0,
    size = 20
  ): Observable<PagedResponse<TvChannel>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/category/${category}`, {
        params,
      })
      .pipe(
        map((response) => {
          // Transform TvBootHttpResponse to PagedResponse format
          const pagination = response.data.pagination;
          const channels = response.data.channels || [];

          return {
            content: channels,
            pageable: {
              pageNumber: pagination?.page || 0,
              pageSize: pagination?.size || size,
              sort: {
                empty: true,
                sorted: false,
                unsorted: true,
              },
              offset: (pagination?.page || 0) * (pagination?.size || size),
              paged: true,
              unpaged: false,
            },
            last: !(pagination?.hasNext || false),
            totalPages: pagination?.totalPages || 1,
            totalElements: pagination?.total || 0,
            size: pagination?.size || size,
            number: pagination?.page || 0,
            sort: {
              empty: true,
              sorted: false,
              unsorted: true,
            },
            first: !(pagination?.hasPrevious || false),
            numberOfElements: channels.length,
            empty: channels.length === 0,
          } as PagedResponse<TvChannel>;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get channels by language
   */
  getChannelsByLanguage(
    language: string, // Changed from languageId to language name
    page = 0,
    size = 20
  ): Observable<PagedResponse<TvChannel>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/language/${language}`, {
        params,
      })
      .pipe(
        map((response) => {
          // Transform TvBootHttpResponse to PagedResponse format
          const pagination = response.data.pagination;
          const channels = response.data.channels || [];

          return {
            content: channels,
            pageable: {
              pageNumber: pagination?.page || 0,
              pageSize: pagination?.size || size,
              sort: {
                empty: true,
                sorted: false,
                unsorted: true,
              },
              offset: (pagination?.page || 0) * (pagination?.size || size),
              paged: true,
              unpaged: false,
            },
            last: !(pagination?.hasNext || false),
            totalPages: pagination?.totalPages || 1,
            totalElements: pagination?.total || 0,
            size: pagination?.size || size,
            number: pagination?.page || 0,
            sort: {
              empty: true,
              sorted: false,
              unsorted: true,
            },
            first: !(pagination?.hasPrevious || false),
            numberOfElements: channels.length,
            empty: channels.length === 0,
          } as PagedResponse<TvChannel>;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get guest channels
   */
  getGuestChannels(page = 0, size = 20): Observable<PagedResponse<TvChannel>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/guest`, { params })
      .pipe(
        map((response) => {
          // Transform TvBootHttpResponse to PagedResponse format
          const pagination = response.data.pagination;
          const channels = response.data.channels || [];

          return {
            content: channels,
            pageable: {
              pageNumber: pagination?.page || 0,
              pageSize: pagination?.size || size,
              sort: {
                empty: true,
                sorted: false,
                unsorted: true,
              },
              offset: (pagination?.page || 0) * (pagination?.size || size),
              paged: true,
              unpaged: false,
            },
            last: !(pagination?.hasNext || false),
            totalPages: pagination?.totalPages || 1,
            totalElements: pagination?.total || 0,
            size: pagination?.size || size,
            number: pagination?.page || 0,
            sort: {
              empty: true,
              sorted: false,
              unsorted: true,
            },
            first: !(pagination?.hasPrevious || false),
            numberOfElements: channels.length,
            empty: channels.length === 0,
          } as PagedResponse<TvChannel>;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Bulk operations
   */
  bulkDeleteChannels(channelIds: number[]): Observable<void> {
    return this.http
      .post<TvBootHttpResponse>(`${this.apiUrl}/bulk`, {
        operation: 'DELETE',
        channelIds,
      })
      .pipe(
        map(() => void 0), // Transform to void
        tap(() => {
          this.clearCache();
          this.refreshChannelsList();
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Create channels in bulk
   */
  createChannelsInBulk(channels: TvChannel[]): Observable<TvChannel[]> {
    return this.http
      .post<TvBootHttpResponse>(`${this.apiUrl}/bulk`, channels)
      .pipe(
        map((response) => response.data.channels || []),
        tap(() => {
          this.clearCache();
          this.refreshChannelsList();
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get recent channels
   */
  getRecentChannels(limit = 10): Observable<TvChannel[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/recent`, { params })
      .pipe(
        map((response) => response.data.channels || []),
        catchError((error) => this.handleError(error))
      );
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
    return this.http.get<TvBootHttpResponse>(`${this.apiUrl}/stats`).pipe(
      map((response) => {
        // Handle the response structure safely
        const data = response.data || {};

        return {
          total: data.total || 0,
          active: data.active || 0,
          byCategory: data.byCategory || {},
          byLanguage: data.byLanguage || {},
        };
      }),
      catchError((error) => {
        console.warn(
          'Stats endpoint failed, calculating from channel data:',
          error
        );
        // Fallback to calculating from channel data if stats endpoint fails
        return this.getAllChannels().pipe(
          map((channels) => {
            const stats = {
              total: channels.length,
              active: channels.filter((c) => c.isActive !== false).length, // Fixed: use isActive instead of active
              byCategory: {} as { [category: string]: number },
              byLanguage: {} as { [language: string]: number },
            };

            // Count by category
            channels.forEach((channel) => {
              const categoryName = channel.category?.name || 'Uncategorized';
              stats.byCategory[categoryName] =
                (stats.byCategory[categoryName] || 0) + 1;
            });

            // Count by language
            channels.forEach((channel) => {
              const languageName = channel.language?.name || 'Unknown';
              stats.byLanguage[languageName] =
                (stats.byLanguage[languageName] || 0) + 1;
            });

            return stats;
          })
        );
      })
    );
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
    console.error('Error response:', error.error);
    console.error('Error status:', error.status);
    console.error('Error message:', error.message);

    this.setLoading(false);

    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Network error - please check your connection';
      } else if (error.status === 404) {
        errorMessage = 'API endpoint not found';
      } else if (error.status === 500) {
        errorMessage = 'Server error';
      } else {
        errorMessage = `Error Code: ${error.status}`;
      }
    }

    this.setError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
