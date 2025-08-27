import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TvChannel,
  TvChannelCreateRequest,
  TvChannelUpdateRequest,
  PagedResponse,
} from '../models/tv-channel.model';

@Injectable({
  providedIn: 'root',
})
export class TvChannelService {
  private apiUrl = 'http://localhost:8080/api/channels';

  constructor(private http: HttpClient) {}

  getAllChannels(): Observable<TvChannel[]> {
    return this.http.get<TvChannel[]>(this.apiUrl);
  }

  getChannelsPaged(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'channelNumber',
    sortDir: string = 'asc'
  ): Observable<PagedResponse<TvChannel>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PagedResponse<TvChannel>>(`${this.apiUrl}/paged`, {
      params,
    });
  }

  getChannelById(id: number): Observable<TvChannel> {
    return this.http.get<TvChannel>(`${this.apiUrl}/${id}`);
  }

  getChannelByNumber(channelNumber: number): Observable<TvChannel> {
    return this.http.get<TvChannel>(`${this.apiUrl}/number/${channelNumber}`);
  }

  getChannelsByCategory(categoryId: number): Observable<TvChannel[]> {
    return this.http.get<TvChannel[]>(`${this.apiUrl}/category/${categoryId}`);
  }

  getChannelsByLanguage(languageId: number): Observable<TvChannel[]> {
    return this.http.get<TvChannel[]>(`${this.apiUrl}/language/${languageId}`);
  }

  searchChannels(
    name: string,
    page: number = 0,
    size: number = 10
  ): Observable<PagedResponse<TvChannel>> {
    const params = new HttpParams()
      .set('name', name)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedResponse<TvChannel>>(`${this.apiUrl}/search`, {
      params,
    });
  }

  createChannel(channel: TvChannelCreateRequest): Observable<TvChannel> {
    return this.http.post<TvChannel>(this.apiUrl, channel);
  }

  updateChannel(
    id: number,
    channel: TvChannelUpdateRequest
  ): Observable<TvChannel> {
    return this.http.put<TvChannel>(`${this.apiUrl}/${id}`, channel);
  }

  deleteChannel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
