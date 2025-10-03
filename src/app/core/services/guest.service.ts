// File: src/app/modules/guests/services/guest.service.ts
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  Gender,
  Guest,
  GuestCreateDto,
  GuestSearchDto,
  GuestStatistics,
  GuestUpdateDto,
  LoyaltyLevel,
  PaginatedResponse,
  TvBootHttpResponse,
} from '../models/guest.model';

@Injectable({
  providedIn: 'root',
})
export class GuestService {
  private readonly baseUrl = `${environment.apiUrl}/v1/guests`;

  private guestsSubject = new BehaviorSubject<Guest[]>([]);
  public guests$ = this.guestsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private statisticsSubject = new BehaviorSubject<GuestStatistics | null>(null);
  public statistics$ = this.statisticsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Create a default empty pagination response
   */
  private createEmptyPaginationResponse(
    page: number = 0,
    size: number = 10
  ): PaginatedResponse<Guest> {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: size,
      number: page,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    };
  }

  /**
   * Get all guests (non-paginated)
   */
  getAllGuests(): Observable<Guest[]> {
    this.loadingSubject.next(true);

    return this.http.get<TvBootHttpResponse>(`${this.baseUrl}/list`).pipe(
      map((response) => response.data?.['guests'] || []),
      tap((guests) => {
        this.guestsSubject.next(guests);
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get paginated guests
   */
  getGuestsPaged(
    page = 0,
    size = 10,
    sortBy = 'firstName',
    sortDir = 'asc'
  ): Observable<PaginatedResponse<Guest>> {
    this.loadingSubject.next(true);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http
      .get<TvBootHttpResponse>(`${this.baseUrl}/paged`, { params })
      .pipe(
        map((response) => {
          try {
            const guests = response.data?.['guests'] || [];
            const pagination = response.data?.['pagination'] || {};

            const result: PaginatedResponse<Guest> = {
              content: guests,
              totalElements: Number(pagination.total) || 0,
              totalPages: Number(pagination.totalPages) || 1,
              size: Number(pagination.size) || size,
              number: Number(pagination.page) || page,
              numberOfElements: guests.length,
              first: (Number(pagination.page) || 0) === 0,
              last: !(pagination.hasNext === true),
              empty: guests.length === 0,
            };

            return result;
          } catch (error) {
            console.error('Error mapping pagination response:', error);
            return this.createEmptyPaginationResponse(page, size);
          }
        }),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          console.error('Error in getGuestsPaged:', error);
          return [this.createEmptyPaginationResponse(page, size)];
        })
      );
  }

  /**
   * Search guests with advanced criteria
   */
  searchGuests(
    searchDto: GuestSearchDto
  ): Observable<PaginatedResponse<Guest>> {
    this.loadingSubject.next(true);

    return this.http
      .post<TvBootHttpResponse>(`${this.baseUrl}/search`, searchDto)
      .pipe(
        map((response) => {
          try {
            const guests = response.data?.['guests'] || [];
            const pagination = response.data?.['pagination'] || {};

            const result: PaginatedResponse<Guest> = {
              content: guests,
              totalElements: Number(pagination.total) || 0,
              totalPages: Number(pagination.totalPages) || 1,
              size: Number(pagination.size) || searchDto.size || 10,
              number: Number(pagination.page) || searchDto.page || 0,
              numberOfElements: guests.length,
              first: (Number(pagination.page) || 0) === 0,
              last: !(pagination.hasNext === true),
              empty: guests.length === 0,
            };

            return result;
          } catch (error) {
            console.error('Error mapping search response:', error);
            return this.createEmptyPaginationResponse(
              searchDto.page || 0,
              searchDto.size || 10
            );
          }
        }),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          console.error('Error in searchGuests:', error);
          return [
            this.createEmptyPaginationResponse(
              searchDto.page || 0,
              searchDto.size || 10
            ),
          ];
        })
      );
  }

  /**
   * Get guest by ID
   */
  getGuestById(id: number): Observable<Guest> {
    return this.http.get<TvBootHttpResponse>(`${this.baseUrl}/${id}`).pipe(
      map((response) => response.data?.['guest']),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get guest by PMS guest ID
   */
  getGuestByPmsId(pmsGuestId: string): Observable<Guest> {
    return this.http
      .get<TvBootHttpResponse>(`${this.baseUrl}/pms-id/${pmsGuestId}`)
      .pipe(
        map((response) => response.data?.['guest']),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get VIP guests
   */
  getVipGuests(): Observable<Guest[]> {
    return this.http.get<TvBootHttpResponse>(`${this.baseUrl}/vip`).pipe(
      map((response) => response.data?.['guests'] || []),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get guests by room
   */
  getGuestsByRoom(roomId: number): Observable<Guest[]> {
    return this.http
      .get<TvBootHttpResponse>(`${this.baseUrl}/room/${roomId}`)
      .pipe(
        map((response) => response.data?.['guests'] || []),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Create new guest
   */
  createGuest(guestDto: GuestCreateDto): Observable<Guest> {
    return this.http.post<TvBootHttpResponse>(`${this.baseUrl}`, guestDto).pipe(
      map((response) => response.data?.['guest']),
      tap(() => this.refreshGuestsList()),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Update existing guest
   */
  updateGuest(id: number, guestDto: GuestUpdateDto): Observable<Guest> {
    return this.http
      .put<TvBootHttpResponse>(`${this.baseUrl}/${id}`, guestDto)
      .pipe(
        map((response) => response.data?.['guest']),
        tap(() => this.refreshGuestsList()),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Delete guest
   */
  deleteGuest(id: number): Observable<void> {
    return this.http.delete<TvBootHttpResponse>(`${this.baseUrl}/${id}`).pipe(
      map(() => void 0),
      tap(() => this.refreshGuestsList()),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Update VIP status
   */
  updateVipStatus(id: number, vipStatus: boolean): Observable<Guest> {
    const params = new HttpParams().set('vipStatus', vipStatus.toString());

    return this.http
      .patch<TvBootHttpResponse>(`${this.baseUrl}/${id}/vip-status`, null, {
        params,
      })
      .pipe(
        map((response) => response.data?.['guest']),
        tap(() => this.refreshGuestsList()),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get guest statistics
   */
  getGuestStatistics(): Observable<GuestStatistics> {
    return this.http.get<TvBootHttpResponse>(`${this.baseUrl}/statistics`).pipe(
      map((response) => response.data?.['statistics']),
      tap((stats) => this.statisticsSubject.next(stats)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Refresh the guests list
   */
  private refreshGuestsList(): void {
    this.getAllGuests().subscribe();
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);

    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.developerMessage) {
        errorMessage = error.error.developerMessage;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
      }
    }

    console.error('Guest Service Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Utility method to get loyalty level options
   */
  getLoyaltyLevels(): Array<{
    value: LoyaltyLevel;
    label: string;
    class: string;
  }> {
    return [
      { value: LoyaltyLevel.BRONZE, label: 'Bronze', class: 'bronze' },
      { value: LoyaltyLevel.SILVER, label: 'Silver', class: 'silver' },
      { value: LoyaltyLevel.GOLD, label: 'Gold', class: 'gold' },
      { value: LoyaltyLevel.PLATINUM, label: 'Platinum', class: 'platinum' },
      { value: LoyaltyLevel.DIAMOND, label: 'Diamond', class: 'diamond' },
    ];
  }

  /**
   * Utility method to get gender options
   */
  getGenderOptions(): Array<{ value: Gender; label: string }> {
    return [
      { value: Gender.MALE, label: 'Male' },
      { value: Gender.FEMALE, label: 'Female' },
      { value: Gender.OTHER, label: 'Other' },
    ];
  }
}
