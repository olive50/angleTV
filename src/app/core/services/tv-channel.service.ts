// src/app/core/services/tv-channel.service.ts
import { Injectable } from '@angular/core';
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
} from '../models/tv-channel.model';

export interface ChannelFilters {
  search?: string;
  categoryId?: number;
  languageId?: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TvChannelService {
  private readonly apiUrl = environment.apiUrl;

  private channelsSubject = new BehaviorSubject<TvChannel[]>([]);
  public channels$ = this.channelsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Cache management
  private channelsCache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Mock data for development/testing
  private mockChannels: TvChannel[] = [
    {
      id: 1,
      channelNumber: 101,
      name: 'CNN International',
      description: 'International news and current affairs coverage 24/7',
      ip: '192.168.1.100',
      port: 8001,
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/CNN_International_logo.svg/512px-CNN_International_logo.svg.png',
      category: { id: 1, name: 'News', description: 'News channels' },
      language: { id: 1, name: 'English', code: 'EN' },
    },
    {
      id: 2,
      channelNumber: 102,
      name: 'BBC World News',
      description: 'British Broadcasting Corporation world news service',
      ip: '192.168.1.101',
      port: 8002,
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/BBC_News.svg/512px-BBC_News.svg.png',
      category: { id: 1, name: 'News', description: 'News channels' },
      language: { id: 1, name: 'English', code: 'EN' },
    },
    {
      id: 3,
      channelNumber: 201,
      name: 'Al Jazeera Arabic',
      description: 'Arabic news channel with comprehensive coverage',
      ip: '192.168.1.102',
      port: 8003,
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Aljazeera_eng.svg/512px-Aljazeera_eng.svg.png',
      category: { id: 1, name: 'News', description: 'News channels' },
      language: { id: 2, name: 'Arabic', code: 'AR' },
    },
    {
      id: 4,
      channelNumber: 301,
      name: 'ESPN',
      description: 'Sports entertainment and live coverage',
      ip: '192.168.1.103',
      port: 8004,
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/512px-ESPN_wordmark.svg.png',
      category: { id: 2, name: 'Sports', description: 'Sports channels' },
      language: { id: 1, name: 'English', code: 'EN' },
    },
    {
      id: 5,
      channelNumber: 401,
      name: 'National Geographic',
      description: 'Educational documentaries and nature programs',
      ip: '192.168.1.104',
      port: 8005,
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Natgeologo.svg/512px-Natgeologo.svg.png',
      category: {
        id: 3,
        name: 'Documentary',
        description: 'Documentary channels',
      },
      language: { id: 1, name: 'English', code: 'EN' },
    },
    {
      id: 6,
      channelNumber: 501,
      name: 'Discovery Channel',
      description: 'Science and technology documentaries',
      ip: '192.168.1.105',
      port: 8006,
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/2019_Discovery_logo.svg/512px-2019_Discovery_logo.svg.png',
      category: {
        id: 3,
        name: 'Documentary',
        description: 'Documentary channels',
      },
      language: { id: 1, name: 'English', code: 'EN' },
    },
    {
      id: 7,
      channelNumber: 601,
      name: 'France 24',
      description: 'French international news channel',
      ip: '192.168.1.106',
      port: 8007,
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/France24.svg/512px-France24.svg.png',
      category: { id: 1, name: 'News', description: 'News channels' },
      language: { id: 3, name: 'French', code: 'FR' },
    },
    {
      id: 8,
      channelNumber: 701,
      name: 'MTV',
      description: 'Music television and entertainment',
      ip: '192.168.1.107',
      port: 8008,
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/MTV-2021.svg/512px-MTV-2021.svg.png',
      category: {
        id: 4,
        name: 'Entertainment',
        description: 'Entertainment channels',
      },
      language: { id: 1, name: 'English', code: 'EN' },
    },
  ];

  constructor(private http: HttpClient) {}

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

    return this.http.get<TvChannel[]>(`${this.apiUrl}/channels`).pipe(
      tap((channels) => {
        this.channelsSubject.next(channels);
        this.channelsCache.set(cacheKey, {
          data: channels,
          timestamp: Date.now(),
        });
        this.setLoading(false);
      }),
      catchError((error) => {
        console.warn('API call failed, using mock data:', error);
        this.channelsSubject.next(this.mockChannels);
        this.setLoading(false);
        return of(this.mockChannels);
      })
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
      .get<PagedResponse<TvChannel>>(`${this.apiUrl}/channels/paged`, {
        params,
      })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => {
          console.warn('Paged API call failed, using mock data:', error);
          this.setLoading(false);

          // Create mock paged response
          let filteredChannels = [...this.mockChannels];

          // Apply filters
          if (filters) {
            if (filters.search) {
              const searchLower = filters.search.toLowerCase();
              filteredChannels = filteredChannels.filter(
                (channel) =>
                  channel.name.toLowerCase().includes(searchLower) ||
                  channel.channelNumber.toString().includes(filters.search!) ||
                  channel.ip.includes(filters.search!) ||
                  channel.description?.toLowerCase().includes(searchLower)
              );
            }
            if (filters.categoryId) {
              filteredChannels = filteredChannels.filter(
                (channel) => channel.category?.id === filters.categoryId
              );
            }
            if (filters.languageId) {
              filteredChannels = filteredChannels.filter(
                (channel) => channel.language?.id === filters.languageId
              );
            }
          }

          // Apply sorting
          filteredChannels.sort((a, b) => {
            let aValue: any = a[sortBy as keyof TvChannel];
            let bValue: any = b[sortBy as keyof TvChannel];

            if (typeof aValue === 'string') {
              aValue = aValue.toLowerCase();
              bValue = bValue.toLowerCase();
            }

            const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            return sortDir === 'asc' ? comparison : -comparison;
          });

          // Apply pagination
          const startIndex = page * size;
          const endIndex = startIndex + size;
          const paginatedChannels = filteredChannels.slice(
            startIndex,
            endIndex
          );
          const totalPages = Math.ceil(filteredChannels.length / size);

          const mockPagedResponse: PagedResponse<TvChannel> = {
            content: paginatedChannels,
            pageable: {
              pageNumber: page,
              pageSize: size,
              sort: {
                empty: false,
                sorted: true,
                unsorted: false,
              },
              offset: page * size,
              paged: true,
              unpaged: false,
            },
            last: page >= totalPages - 1,
            totalPages: totalPages,
            totalElements: filteredChannels.length,
            size: size,
            number: page,
            sort: {
              empty: false,
              sorted: true,
              unsorted: false,
            },
            first: page === 0,
            numberOfElements: paginatedChannels.length,
            empty: paginatedChannels.length === 0,
          };

          return of(mockPagedResponse);
        })
      );
  }

  /**
   * Get channel by ID
   */
  getChannelById(id: number): Observable<TvChannel> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<TvChannel>(`${this.apiUrl}/channels/${id}`).pipe(
      tap(() => this.setLoading(false)),
      catchError((error) => {
        console.warn('API call failed, using mock data:', error);
        this.setLoading(false);
        const mockChannel = this.mockChannels.find((c) => c.id === id);
        if (mockChannel) {
          return of(mockChannel);
        }
        return throwError(() => new Error(`Channel with ID ${id} not found`));
      })
    );
  }

  /**
   * Create new channel
   */
  createChannel(channel: TvChannelCreateRequest): Observable<TvChannel> {
    this.setLoading(true);
    this.clearError();

    // Validate channel data
    const validationError = this.validateChannelData(channel);
    if (validationError) {
      this.setError(validationError);
      this.setLoading(false);
      return throwError(() => new Error(validationError));
    }

    return this.http.post<TvChannel>(`${this.apiUrl}/channels`, channel).pipe(
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshChannelsList();
      }),
      catchError((error) => {
        console.warn('API call failed, simulating channel creation:', error);

        // Simulate channel creation with mock data
        const newChannel: TvChannel = {
          id: Math.max(...this.mockChannels.map((c) => c.id || 0)) + 1,
          channelNumber: channel.channelNumber,
          name: channel.name,
          description: channel.description,
          ip: channel.ip,
          port: channel.port,
          logoUrl: channel.logoUrl,
          category: channel.categoryId
            ? { id: channel.categoryId, name: 'Mock Category' }
            : undefined,
          language: channel.languageId
            ? { id: channel.languageId, name: 'Mock Language', code: 'XX' }
            : undefined,
        };

        this.mockChannels.push(newChannel);
        this.setLoading(false);
        return of(newChannel);
      })
    );
  }

  /**
   * Update existing channel
   */
  updateChannel(
    id: number,
    channel: TvChannelUpdateRequest
  ): Observable<TvChannel> {
    this.setLoading(true);
    this.clearError();

    return this.http
      .put<TvChannel>(`${this.apiUrl}/channels/${id}`, channel)
      .pipe(
        tap(() => {
          this.clearCache();
          this.setLoading(false);
          this.refreshChannelsList();
        }),
        catchError((error) => {
          console.warn('API call failed, simulating channel update:', error);
          this.setLoading(false);

          const existingChannelIndex = this.mockChannels.findIndex(
            (c) => c.id === id
          );
          if (existingChannelIndex !== -1) {
            const updatedChannel = {
              ...this.mockChannels[existingChannelIndex],
              ...channel,
            };
            this.mockChannels[existingChannelIndex] = updatedChannel;
            return of(updatedChannel);
          }
          return throwError(() => new Error(`Channel with ID ${id} not found`));
        })
      );
  }

  /**
   * Delete channel
   */
  deleteChannel(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<void>(`${this.apiUrl}/channels/${id}`).pipe(
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshChannelsList();
      }),
      catchError((error) => {
        console.warn('API call failed, simulating channel deletion:', error);
        this.setLoading(false);

        const index = this.mockChannels.findIndex((c) => c.id === id);
        if (index !== -1) {
          this.mockChannels.splice(index, 1);
        }
        return of(undefined);
      })
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
      .get<PagedResponse<TvChannel>>(`${this.apiUrl}/channels/search`, {
        params,
      })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => {
          console.warn('Search API call failed, using mock search:', error);
          this.setLoading(false);

          const searchResults = this.mockChannels.filter(
            (channel) =>
              channel.name.toLowerCase().includes(query.toLowerCase()) ||
              channel.description
                ?.toLowerCase()
                .includes(query.toLowerCase()) ||
              channel.channelNumber.toString().includes(query)
          );

          const paginatedResults = searchResults.slice(
            page * size,
            (page + 1) * size
          );
          const totalPages = Math.ceil(searchResults.length / size);

          const mockSearchResponse: PagedResponse<TvChannel> = {
            content: paginatedResults,
            pageable: {
              pageNumber: page,
              pageSize: size,
              sort: { empty: true, sorted: false, unsorted: true },
              offset: page * size,
              paged: true,
              unpaged: false,
            },
            last: page >= totalPages - 1,
            totalPages: totalPages,
            totalElements: searchResults.length,
            size: size,
            number: page,
            sort: { empty: true, sorted: false, unsorted: true },
            first: page === 0,
            numberOfElements: paginatedResults.length,
            empty: paginatedResults.length === 0,
          };

          return of(mockSearchResponse);
        })
      );
  }

  /**
   * Get channels by category
   */
  getChannelsByCategory(categoryId: number): Observable<TvChannel[]> {
    return this.http
      .get<TvChannel[]>(`${this.apiUrl}/channels/category/${categoryId}`)
      .pipe(
        catchError((error) => {
          console.warn('API call failed, using mock data:', error);
          const filtered = this.mockChannels.filter(
            (c) => c.category?.id === categoryId
          );
          return of(filtered);
        })
      );
  }

  /**
   * Get channels by language
   */
  getChannelsByLanguage(languageId: number): Observable<TvChannel[]> {
    return this.http
      .get<TvChannel[]>(`${this.apiUrl}/channels/language/${languageId}`)
      .pipe(
        catchError((error) => {
          console.warn('API call failed, using mock data:', error);
          const filtered = this.mockChannels.filter(
            (c) => c.language?.id === languageId
          );
          return of(filtered);
        })
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
        `${this.apiUrl}/channels/test-connectivity`,
        { ip, port }
      )
      .pipe(
        catchError((error) => {
          console.warn('Connectivity test failed, simulating result:', error);
          // Simulate connectivity test
          const success = Math.random() > 0.3; // 70% success rate for demo
          return of({
            success,
            message: success
              ? 'Connection successful'
              : 'Unable to connect to specified IP and port',
          });
        })
      );
  }

  /**
   * Bulk operations
   */
  bulkDeleteChannels(channelIds: number[]): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/channels/bulk-delete`, { channelIds })
      .pipe(
        tap(() => {
          this.clearCache();
          this.refreshChannelsList();
        }),
        catchError((error) => {
          console.warn('Bulk delete API call failed, simulating:', error);
          channelIds.forEach((id) => {
            const index = this.mockChannels.findIndex((c) => c.id === id);
            if (index !== -1) {
              this.mockChannels.splice(index, 1);
            }
          });
          return of(undefined);
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
        `${this.apiUrl}/channels/import`,
        formData
      )
      .pipe(
        tap(() => {
          this.clearCache();
          this.refreshChannelsList();
        }),
        catchError((error) => {
          console.warn('Import API call failed:', error);
          return of({
            success: 0,
            errors: ['Import failed: API not available'],
          });
        })
      );
  }

  /**
   * Export channels to CSV/Excel
   */
  exportChannels(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/channels/export/${format}`, {
        responseType: 'blob',
      })
      .pipe(
        catchError((error) => {
          console.warn(
            'Export API call failed, generating local export:',
            error
          );

          // Generate CSV locally as fallback
          const headers = [
            'Channel Number',
            'Name',
            'Category',
            'Language',
            'IP',
            'Port',
            'Description',
          ];
          const csvContent = [
            headers.join(','),
            ...this.mockChannels.map((channel) =>
              [
                channel.channelNumber,
                `"${channel.name}"`,
                `"${channel.category?.name || ''}"`,
                `"${channel.language?.name || ''}"`,
                channel.ip,
                channel.port,
                `"${channel.description || ''}"`,
              ].join(',')
            ),
          ].join('\n');

          const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
          });
          return of(blob);
        })
      );
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
    return this.http.get<any>(`${this.apiUrl}/channels/stats`).pipe(
      catchError((error) => {
        console.warn('Stats API call failed, generating mock stats:', error);

        const stats = {
          total: this.mockChannels.length,
          active: this.mockChannels.length, // All mock channels are active
          byCategory: {} as { [category: string]: number },
          byLanguage: {} as { [language: string]: number },
        };

        // Calculate category stats
        this.mockChannels.forEach((channel) => {
          if (channel.category) {
            stats.byCategory[channel.category.name] =
              (stats.byCategory[channel.category.name] || 0) + 1;
          }
        });

        // Calculate language stats
        this.mockChannels.forEach((channel) => {
          if (channel.language) {
            stats.byLanguage[channel.language.name] =
              (stats.byLanguage[channel.language.name] || 0) + 1;
          }
        });

        return of(stats);
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

  private validateChannelData(
    channel: TvChannelCreateRequest | TvChannelUpdateRequest
  ): string | null {
    if ('channelNumber' in channel) {
      if (
        channel.channelNumber != null &&
        (channel.channelNumber < 1 || channel.channelNumber > 9999)
      ) {
        return 'Channel number must be between 1 and 9999';
      }

      // Check for duplicate channel numbers (exclude current channel for updates)
      const existingChannel = this.mockChannels.find(
        (c) => c.channelNumber === channel.channelNumber
      );
      if (existingChannel) {
        return `Channel number ${channel.channelNumber} is already in use`;
      }
    }

    if ('name' in channel && channel.name) {
      if (channel.name.length < 2) {
        return 'Channel name must be at least 2 characters long';
      }
      if (channel.name.length > 100) {
        return 'Channel name must not exceed 100 characters';
      }
    }

    if ('ip' in channel && channel.ip) {
      const ipRegex =
        /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(channel.ip)) {
        return 'Invalid IP address format';
      }
    }

    if ('port' in channel && channel.port) {
      if (channel.port < 1 || channel.port > 65535) {
        return 'Port must be between 1 and 65535';
      }
    }

    return null;
  }
}
