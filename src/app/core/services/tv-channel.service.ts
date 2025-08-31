// src/app/core/services/tv-channel.service.ts (mis à jour)
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { TvChannel, TvChannelCreateRequest, TvChannelUpdateRequest } from '../models/tv-channel.model';
import { PagedApiResponse } from '../models/api-response.model';

export interface ChannelFilters {
  search?: string;
  categoryId?: number;
  languageId?: number;
  isActive?: boolean;
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

  getAllChannels(forceRefresh = false): Observable<TvChannel[]> {
    const cacheKey = 'all_channels';
    
    if (!forceRefresh && this.channelsCache.has(cacheKey)) {
      const cached = this.channelsCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.channelsSubject.next(cached.data);
        return this.channels$;
      }
    }

    this.loadingSubject.next(true);
    
    return this.get<TvChannel[]>('/channels').pipe(
      tap(channels => {
        this.channelsSubject.next(channels);
        this.channelsCache.set(cacheKey, { data: channels, timestamp: Date.now() });
        this.loadingSubject.next(false);
      })
    );
  }

  getChannelsPaged(
    page = 0,
    size = 20,
    sortBy = 'channelNumber',
    sortDir = 'asc',
    filters?: ChannelFilters
  ): Observable<PagedApiResponse<TvChannel>['data']> {
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

    return this.getPagedData<TvChannel>('/channels/paged', params).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  getChannelById(id: number): Observable<TvChannel> {
    return this.get<TvChannel>(`/channels/${id}`);
  }

  createChannel(channel: TvChannelCreateRequest): Observable<TvChannel> {
    return this.post<TvChannel>('/channels', channel).pipe(
      tap(() => {
        this.channelsCache.clear(); // Clear cache after modification
        this.getAllChannels(true); // Refresh channels list
      })
    );
  }

  updateChannel(id: number, channel: TvChannelUpdateRequest): Observable<TvChannel> {
    return this.put<TvChannel>(`/channels/${id}`, channel).pipe(
      tap(() => {
        this.channelsCache.clear();
        this.getAllChannels(true);
      })
    );
  }

  deleteChannel(id: number): Observable<void> {
    return this.delete<void>(`/channels/${id}`).pipe(
      tap(() => {
        this.channelsCache.clear();
        this.getAllChannels(true);
      })
    );
  }

  searchChannels(query: string, page = 0, size = 20): Observable<PagedApiResponse<TvChannel>['data']> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.getPagedData<TvChannel>('/channels/search', params);
  }

  getChannelsByCategory(categoryId: number): Observable<TvChannel[]> {
    return this.get<TvChannel[]>(`/channels/category/${categoryId}`);
  }

  getChannelsByLanguage(languageId: number): Observable<TvChannel[]> {
    return this.get<TvChannel[]>(`/channels/language/${languageId}`);
  }

  // Méthodes utilitaires
  clearCache(): void {
    this.channelsCache.clear();
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  refreshChannels(): void {
    this.getAllChannels(true).subscribe();
  }
}