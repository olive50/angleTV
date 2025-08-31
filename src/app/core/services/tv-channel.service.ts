// src/app/core/services/tv-channel.service.ts
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { TvChannel, TvChannelCreateRequest, TvChannelUpdateRequest } from '../models/tv-channel.model';
import { PagedApiResponse } from '../models/api-response.model';

export interface ChannelFilters {
  search?: string;
  categoryId?: number;
  languageId?: number;
  isActive?: boolean;
}

// Define the exact Spring Boot Page response format from your API
export interface PagedChannelResponse {
  content: TvChannel[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TvChannelService extends BaseApiService {
  private channelsSubject = new BehaviorSubject<TvChannel[]>([]);
  public channels$ = this.channelsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Cache pour éviter les appels répétés
  private channelsCache = new Map<string, { data: any, timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Mock data for development/testing
  private mockChannels: TvChannel[] = [
    {
      id: 1,
      channelNumber: 101,
      name: 'CNN International',
      description: 'International news channel',
      ip: '192.168.1.100',
      port: 8001,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/CNN_International_logo.svg/512px-CNN_International_logo.svg.png',
      category: { id: 1, name: 'News', description: 'News channels' },
      language: { id: 1, name: 'English', code: 'EN' }
    },
    {
      id: 2,
      channelNumber: 102,
      name: 'BBC World News',
      description: 'British news and current affairs',
      ip: '192.168.1.101',
      port: 8002,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/BBC_News.svg/512px-BBC_News.svg.png',
      category: { id: 1, name: 'News', description: 'News channels' },
      language: { id: 1, name: 'English', code: 'EN' }
    },
    {
      id: 3,
      channelNumber: 201,
      name: 'Al Jazeera Arabic',
      description: 'Arabic news channel',
      ip: '192.168.1.102',
      port: 8003,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Aljazeera_eng.svg/512px-Aljazeera_eng.svg.png',
      category: { id: 1, name: 'News', description: 'News channels' },
      language: { id: 2, name: 'Arabic', code: 'AR' }
    },
    {
      id: 4,
      channelNumber: 301,
      name: 'ESPN',
      description: 'Sports entertainment channel',
      ip: '192.168.1.103',
      port: 8004,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/512px-ESPN_wordmark.svg.png',
      category: { id: 2, name: 'Sports', description: 'Sports channels' },
      language: { id: 1, name: 'English', code: 'EN' }
    },
    {
      id: 5,
      channelNumber: 401,
      name: 'National Geographic',
      description: 'Educational and documentary channel',
      ip: '192.168.1.104',
      port: 8005,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Natgeologo.svg/512px-Natgeologo.svg.png',
      category: { id: 3, name: 'Documentary', description: 'Documentary channels' },
      language: { id: 1, name: 'English', code: 'EN' }
    }
  ];

  getAllChannels(forceRefresh = false): Observable<TvChannel[]> {
    const cacheKey = 'all_channels';
    
    if (!forceRefresh && this.channelsCache.has(cacheKey)) {
      const cached = this.channelsCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.channelsSubject.next(cached.data);
        return of(cached.data);
      }
    }

    this.loadingSubject.next(true);
    
    // Try to get from real API, fallback to mock data
    return this.http.get<TvChannel[]>(`${this.apiUrl}/channels`).pipe(
      tap(channels => {
        this.channelsSubject.next(channels);
        this.channelsCache.set(cacheKey, { data: channels, timestamp: Date.now() });
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.warn('API call failed, using mock data:', error);
        // Use mock data as fallback
        this.channelsSubject.next(this.mockChannels);
        this.loadingSubject.next(false);
        return of(this.mockChannels);
      })
    );
  }

  getChannelsPaged(
    page = 0,
    size = 20,
    sortBy = 'channelNumber',
    sortDir = 'asc',
    filters?: ChannelFilters
  ): Observable<PagedChannelResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortBy},${sortDir}`);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
      if (filters.languageId) params = params.set('languageId', filters.languageId.toString());
      if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
    }

    this.loadingSubject.next(true);

    // Make direct HTTP call to get the exact Spring Boot Page response
    return this.http.get<PagedChannelResponse>(`${this.apiUrl}/channels/paged`, { params }).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        console.warn('Paged API call failed, using mock data:', error);
        this.loadingSubject.next(false);
        
        // Create mock paged response in the exact same format as your API
        let filteredChannels = [...this.mockChannels];
        
        // Apply filters to mock data
        if (filters) {
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredChannels = filteredChannels.filter(channel => 
              channel.name.toLowerCase().includes(searchLower) ||
              channel.channelNumber.toString().includes(searchLower) ||
              channel.ip.includes(filters.search!) ||
              channel.description?.toLowerCase().includes(searchLower)
            );
          }
          if (filters.categoryId) {
            filteredChannels = filteredChannels.filter(channel => 
              channel.category?.id === filters.categoryId
            );
          }
          if (filters.languageId) {
            filteredChannels = filteredChannels.filter(channel => 
              channel.language?.id === filters.languageId
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
        const paginatedChannels = filteredChannels.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredChannels.length / size);
        
        // Create response in exact Spring Boot format
        const mockPagedResponse: PagedChannelResponse = {
          content: paginatedChannels,
          pageable: {
            pageNumber: page,
            pageSize: size,
            sort: {
              empty: false,
              sorted: true,
              unsorted: false
            },
            offset: page * size,
            paged: true,
            unpaged: false
          },
          last: page >= totalPages - 1,
          totalPages: totalPages,
          totalElements: filteredChannels.length,
          size: size,
          number: page,
          sort: {
            empty: false,
            sorted: true,
            unsorted: false
          },
          first: page === 0,
          numberOfElements: paginatedChannels.length,
          empty: paginatedChannels.length === 0
        };

        return of(mockPagedResponse);
      })
    );
  }

  getChannelById(id: number): Observable<TvChannel> {
    return this.http.get<TvChannel>(`${this.apiUrl}/channels/${id}`).pipe(
      catchError(error => {
        console.warn('API call failed, using mock data:', error);
        const mockChannel = this.mockChannels.find(c => c.id === id);
        if (mockChannel) {
          return of(mockChannel);
        }
        throw error;
      })
    );
  }

  createChannel(channel: TvChannelCreateRequest): Observable<TvChannel> {
    return this.http.post<TvChannel>(`${this.apiUrl}/channels`, channel).pipe(
      tap(() => {
        this.channelsCache.clear();
        this.getAllChannels(true).subscribe();
      }),
      catchError(error => {
        console.warn('API call failed, simulating channel creation:', error);
        // Simulate channel creation with mock data
        const newChannel: TvChannel = {
          id: Math.max(...this.mockChannels.map(c => c.id || 0)) + 1,
          channelNumber: channel.channelNumber,
          name: channel.name,
          description: channel.description,
          ip: channel.ip,
          port: channel.port,
          logoUrl: channel.logoUrl,
          category: channel.categoryId ? { id: channel.categoryId, name: 'Mock Category' } : undefined,
          language: channel.languageId ? { id: channel.languageId, name: 'Mock Language', code: 'XX' } : undefined
        };
        this.mockChannels.push(newChannel);
        return of(newChannel);
      })
    );
  }

  updateChannel(id: number, channel: TvChannelUpdateRequest): Observable<TvChannel> {
    return this.http.put<TvChannel>(`${this.apiUrl}/channels/${id}`, channel).pipe(
      tap(() => {
        this.channelsCache.clear();
        this.getAllChannels(true).subscribe();
      }),
      catchError(error => {
        console.warn('API call failed, simulating channel update:', error);
        const existingChannelIndex = this.mockChannels.findIndex(c => c.id === id);
        if (existingChannelIndex !== -1) {
          const updatedChannel = { ...this.mockChannels[existingChannelIndex], ...channel };
          this.mockChannels[existingChannelIndex] = updatedChannel;
          return of(updatedChannel);
        }
        throw error;
      })
    );
  }

  deleteChannel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/channels/${id}`).pipe(
      tap(() => {
        this.channelsCache.clear();
        this.getAllChannels(true).subscribe();
      }),
      catchError(error => {
        console.warn('API call failed, simulating channel deletion:', error);
        const index = this.mockChannels.findIndex(c => c.id === id);
        if (index !== -1) {
          this.mockChannels.splice(index, 1);
        }
        return of(undefined);
      })
    );
  }

  searchChannels(query: string, page = 0, size = 20): Observable<PagedChannelResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedChannelResponse>(`${this.apiUrl}/channels/search`, { params }).pipe(
      catchError(error => {
        console.warn('Search API call failed, using mock search:', error);
        
        const searchResults = this.mockChannels.filter(channel => 
          channel.name.toLowerCase().includes(query.toLowerCase()) ||
          channel.description?.toLowerCase().includes(query.toLowerCase())
        );
        
        const paginatedResults = searchResults.slice(page * size, (page + 1) * size);
        const totalPages = Math.ceil(searchResults.length / size);
        
        // Create complete Spring Boot Page response format
        const mockSearchResponse: PagedChannelResponse = {
          content: paginatedResults,
          pageable: {
            pageNumber: page,
            pageSize: size,
            sort: {
              empty: true,
              sorted: false,
              unsorted: true
            },
            offset: page * size,
            paged: true,
            unpaged: false
          },
          last: page >= totalPages - 1,
          totalPages: totalPages,
          totalElements: searchResults.length,
          size: size,
          number: page,
          sort: {
            empty: true,
            sorted: false,
            unsorted: true
          },
          first: page === 0,
          numberOfElements: paginatedResults.length,
          empty: paginatedResults.length === 0
        };
        
        return of(mockSearchResponse);
      })
    );
  }

  getChannelsByCategory(categoryId: number): Observable<TvChannel[]> {
    return this.http.get<TvChannel[]>(`${this.apiUrl}/channels/category/${categoryId}`).pipe(
      catchError(error => {
        console.warn('API call failed, using mock data:', error);
        const filtered = this.mockChannels.filter(c => c.category?.id === categoryId);
        return of(filtered);
      })
    );
  }

  getChannelsByLanguage(languageId: number): Observable<TvChannel[]> {
    return this.http.get<TvChannel[]>(`${this.apiUrl}/channels/language/${languageId}`).pipe(
      catchError(error => {
        console.warn('API call failed, using mock data:', error);
        const filtered = this.mockChannels.filter(c => c.language?.id === languageId);
        return of(filtered);
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

  refreshChannels(): void {
    this.clearCache();
    this.getAllChannels(true).subscribe();
  }
}