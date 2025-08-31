// src/app/core/services/guest.service.ts
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Guest, LoyaltyLevel, ReservationStatus } from '../models/guest.model';
import { PagedApiResponse } from '../models/api-response.model';

export interface GuestFilters {
  search?: string;
  status?: ReservationStatus;
  vipStatus?: boolean;
  loyaltyLevel?: LoyaltyLevel;
  roomId?: number;
}

export interface GuestCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  idNumber: string;
  vipStatus?: boolean;
  loyaltyLevel?: LoyaltyLevel;
}

@Injectable({
  providedIn: 'root'
})
export class GuestService extends BaseApiService {
  private guestsSubject = new BehaviorSubject<Guest[]>([]);
  public guests$ = this.guestsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  getAllGuests(forceRefresh = false): Observable<Guest[]> {
    this.loadingSubject.next(true);
    
    return this.get<Guest[]>('/guests').pipe(
      tap(guests => {
        this.guestsSubject.next(guests);
        this.loadingSubject.next(false);
      })
    );
  }

  getGuestsPaged(
    page = 0,
    size = 20,
    sortBy = 'lastName',
    sortDir = 'asc',
    filters?: GuestFilters
  ): Observable<PagedApiResponse<Guest>['data']> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortBy},${sortDir}`);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.vipStatus !== undefined) params = params.set('vipStatus', filters.vipStatus.toString());
      if (filters.loyaltyLevel) params = params.set('loyaltyLevel', filters.loyaltyLevel);
      if (filters.roomId) params = params.set('roomId', filters.roomId.toString());
    }

    this.loadingSubject.next(true);

    return this.getPagedData<Guest>('/guests/paged', params).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  getGuestById(id: number): Observable<Guest> {
    return this.get<Guest>(`/guests/${id}`);
  }

  createGuest(guest: GuestCreateRequest): Observable<Guest> {
    return this.post<Guest>('/guests', guest).pipe(
      tap(() => this.refreshGuests())
    );
  }

  updateGuest(id: number, guest: Partial<Guest>): Observable<Guest> {
    return this.put<Guest>(`/guests/${id}`, guest).pipe(
      tap(() => this.refreshGuests())
    );
  }

  deleteGuest(id: number): Observable<void> {
    return this.delete<void>(`/guests/${id}`).pipe(
      tap(() => this.refreshGuests())
    );
  }

  // Actions spécifiques aux guests
  checkIn(guestId: number, roomId: number, checkInData?: any): Observable<Guest> {
    return this.post<Guest>(`/guests/${guestId}/checkin`, { roomId, ...checkInData }).pipe(
      tap(() => this.refreshGuests())
    );
  }

  checkOut(guestId: number, checkOutData?: any): Observable<Guest> {
    return this.post<Guest>(`/guests/${guestId}/checkout`, checkOutData).pipe(
      tap(() => this.refreshGuests())
    );
  }

  searchGuests(query: string, page = 0, size = 20): Observable<PagedApiResponse<Guest>['data']> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.getPagedData<Guest>('/guests/search', params);
  }

  private refreshGuests(): void {
    this.getAllGuests(true).subscribe();
  }
}