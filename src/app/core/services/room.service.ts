// Updated room.service.ts to work with TvBootHttpResponse
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Room,
  RoomCreateRequest,
  RoomUpdateRequest,
  RoomFilters,
  RoomStatistics,
  RoomAvailability,
  MaintenanceRecord,
  RoomStatus,
  MaintenanceType,
  MaintenanceStatus,
  RoomType,
  ViewType,
  BedType,
} from '../models/room.model';
import { SpringBootPageResponse } from '../models/api-response.model';

// Interface for TvBootHttpResponse to match your backend
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
    rooms?: Room[];
    room?: Room;
    count?: number;
    statistics?: RoomStatistics;
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private readonly apiUrl = `${environment.apiUrl}/rooms`;

  // State management
  private roomsSubject = new BehaviorSubject<Room[]>([]);
  public rooms$ = this.roomsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Cache management
  private roomsCache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  /**
   * Get paginated rooms - Updated for TvBootHttpResponse
   */
  getRoomsPaged(
    page = 0,
    size = 24,
    sortBy = 'roomNumber',
    sortDir = 'asc',
    filters?: RoomFilters
  ): Observable<SpringBootPageResponse<Room>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortBy},${sortDir}`);

    if (filters) {
      if (filters.search) params = params.set('q', filters.search);
      if (filters.roomType) params = params.set('roomType', filters.roomType);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.floorNumber)
        params = params.set('floorNumber', filters.floorNumber.toString());
      if (filters.building) params = params.set('building', filters.building);
      if (filters.minPrice)
        params = params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice)
        params = params.set('maxPrice', filters.maxPrice.toString());
    }

    this.setLoading(true);
    return this.http.get<TvBootHttpResponse>(this.apiUrl, { params }).pipe(
      map((response: TvBootHttpResponse) => {
        // Transform TvBootHttpResponse to SpringBootPageResponse format
        const data = response.data || {};
        const pagination = data.pagination || {};
        const rooms = data.rooms || [];

        return {
          content: rooms,
          pageable: {
            pageNumber: pagination.page || 0,
            pageSize: pagination.size || size,
            sort: {
              empty: true,
              sorted: false,
              unsorted: true,
            },
            offset: (pagination.page || 0) * (pagination.size || size),
            paged: true,
            unpaged: false,
          },
          last: !(pagination.hasNext || false),
          totalPages: pagination.totalPages || 1,
          totalElements: pagination.total || 0,
          size: pagination.size || size,
          number: pagination.page || 0,
          sort: {
            empty: true,
            sorted: false,
            unsorted: true,
          },
          first: !(pagination.hasPrevious || false),
          numberOfElements: rooms.length,
          empty: rooms.length === 0,
        } as SpringBootPageResponse<Room>;
      }),
      tap(() => this.setLoading(false)),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Get all rooms (non-paginated)
   */
  getRooms(filters?: RoomFilters): Observable<Room[]> {
    const cacheKey = this.getCacheKey('rooms', filters);

    if (this.roomsCache.has(cacheKey)) {
      const cached = this.roomsCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.roomsSubject.next(cached.data);
        return of(cached.data);
      }
    }

    this.setLoading(true);
    let params = new HttpParams();

    if (filters) {
      if (filters.search) params = params.set('q', filters.search);
      if (filters.roomType) params = params.set('roomType', filters.roomType);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.floorNumber)
        params = params.set('floorNumber', filters.floorNumber.toString());
      if (filters.building) params = params.set('building', filters.building);
      if (filters.minPrice)
        params = params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice)
        params = params.set('maxPrice', filters.maxPrice.toString());
    }

    return this.http.get<TvBootHttpResponse>(this.apiUrl, { params }).pipe(
      map((response: TvBootHttpResponse) => {
        const rooms = response.data.rooms || [];
        return rooms;
      }),
      tap((rooms) => {
        this.roomsSubject.next(rooms);
        this.roomsCache.set(cacheKey, { data: rooms, timestamp: Date.now() });
        this.setLoading(false);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Get room by ID
   */
  getRoomById(id: number): Observable<Room> {
    this.setLoading(true);
    return this.http.get<TvBootHttpResponse>(`${this.apiUrl}/${id}`).pipe(
      map((response: TvBootHttpResponse) => response.data.room as Room),
      tap(() => this.setLoading(false)),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Get room by number
   */
  getRoomByNumber(roomNumber: string): Observable<Room> {
    this.setLoading(true);
    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/number/${roomNumber}`)
      .pipe(
        map((response: TvBootHttpResponse) => response.data.room as Room),
        tap(() => this.setLoading(false)),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Create new room
   */
  createRoom(room: RoomCreateRequest): Observable<Room> {
    this.setLoading(true);
    return this.http.post<TvBootHttpResponse>(this.apiUrl, room).pipe(
      map((response: TvBootHttpResponse) => response.data.room as Room),
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshRooms();
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Update room
   */
  updateRoom(id: number, room: RoomUpdateRequest): Observable<Room> {
    this.setLoading(true);
    return this.http.put<TvBootHttpResponse>(`${this.apiUrl}/${id}`, room).pipe(
      map((response: TvBootHttpResponse) => response.data.room as Room),
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshRooms();
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Delete room
   */
  deleteRoom(id: number): Observable<void> {
    this.setLoading(true);
    return this.http.delete<TvBootHttpResponse>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0), // Transform to void
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshRooms();
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Change room status
   */
  changeRoomStatus(id: number, status: RoomStatus): Observable<Room> {
    return this.http
      .patch<TvBootHttpResponse>(`${this.apiUrl}/${id}/status`, null, {
        params: { status: status.toString() },
      })
      .pipe(
        map((response: TvBootHttpResponse) => response.data.room as Room),
        tap(() => {
          this.clearCache();
          this.refreshRooms();
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get room statistics
   */
  getRoomStatistics(): Observable<RoomStatistics> {
    return this.http.get<TvBootHttpResponse>(`${this.apiUrl}/statistics`).pipe(
      map((response: TvBootHttpResponse) => {
        const stats = response.data.statistics;
        if (stats) {
          return stats;
        }
        // Fallback if statistics not in expected format
        return response.data as RoomStatistics;
      }),
      catchError((error) => {
        console.warn('Failed to load room statistics:', error);
        // Return mock statistics as fallback
        return of({
          total: 0,
          available: 0,
          occupied: 0,
          reserved: 0,
          maintenance: 0,
          outOfOrder: 0,
          cleaning: 0,
          occupancy: 0,
          averagePricePerNight: 0,
          revenueToday: 0,
          revenueThisMonth: 0,
          byType: {},
          byFloor: {},
          byStatus: {},
        });
      })
    );
  }

  /**
   * Search rooms
   */
  searchRooms(query: string): Observable<Room[]> {
    const params = new HttpParams().set('q', query);

    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/search`, { params })
      .pipe(
        map((response: TvBootHttpResponse) => response.data.rooms || []),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get rooms by type
   */
  getRoomsByType(roomType: RoomType): Observable<Room[]> {
    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/type/${roomType}`)
      .pipe(
        map((response: TvBootHttpResponse) => response.data.rooms || []),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get rooms by building
   */
  getRoomsByBuilding(building: string): Observable<Room[]> {
    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/building/${building}`)
      .pipe(
        map((response: TvBootHttpResponse) => response.data.rooms || []),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get rooms by price range
   */
  getRoomsByPriceRange(minPrice: number, maxPrice: number): Observable<Room[]> {
    const params = new HttpParams()
      .set('minPrice', minPrice.toString())
      .set('maxPrice', maxPrice.toString());

    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/price-range`, { params })
      .pipe(
        map((response: TvBootHttpResponse) => response.data.rooms || []),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get rooms available for guests
   */
  getRoomsAvailableForGuests(numberOfGuests: number): Observable<Room[]> {
    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/capacity/${numberOfGuests}`)
      .pipe(
        map((response: TvBootHttpResponse) => response.data.rooms || []),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get available rooms count
   */
  getAvailableRoomsCount(): Observable<number> {
    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/count/available`)
      .pipe(
        map((response: TvBootHttpResponse) => response.data.count || 0),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Assign channel package to room
   */
  assignChannelPackage(roomId: number, packageId: number): Observable<Room> {
    return this.http
      .post<TvBootHttpResponse>(
        `${this.apiUrl}/${roomId}/channel-package/${packageId}`,
        {}
      )
      .pipe(
        map((response: TvBootHttpResponse) => response.data.room as Room),
        tap(() => {
          this.clearCache();
          this.refreshRooms();
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Remove channel package from room
   */
  removeChannelPackage(roomId: number): Observable<Room> {
    return this.http
      .delete<TvBootHttpResponse>(`${this.apiUrl}/${roomId}/channel-package`)
      .pipe(
        map((response: TvBootHttpResponse) => response.data.room as Room),
        tap(() => {
          this.clearCache();
          this.refreshRooms();
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get available rooms for date range
   */
  getAvailableRooms(
    checkIn?: Date,
    checkOut?: Date,
    guestCount?: number
  ): Observable<Room[]> {
    let params = new HttpParams();

    if (checkIn) params = params.set('checkIn', checkIn.toISOString());
    if (checkOut) params = params.set('checkOut', checkOut.toISOString());
    if (guestCount) params = params.set('guestCount', guestCount.toString());

    return this.http
      .get<TvBootHttpResponse>(`${this.apiUrl}/available`, { params })
      .pipe(
        map((response: TvBootHttpResponse) => response.data.rooms || []),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Bulk operations
   */
  bulkUpdateStatus(roomIds: number[], status: RoomStatus): Observable<any> {
    return this.http
      .patch<TvBootHttpResponse>(`${this.apiUrl}/bulk/status`, {
        roomIds,
        status,
      })
      .pipe(
        map((response: TvBootHttpResponse) => response.data),
        tap(() => {
          this.clearCache();
          this.refreshRooms();
        }),
        catchError((error) => this.handleError(error))
      );
  }

  bulkDelete(roomIds: number[]): Observable<any> {
    return this.http
      .post<TvBootHttpResponse>(`${this.apiUrl}/bulk/delete`, { roomIds })
      .pipe(
        map((response: TvBootHttpResponse) => response.data),
        tap(() => {
          this.clearCache();
          this.refreshRooms();
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Get room types configuration
   */
  getRoomTypes(): { value: RoomType; label: string }[] {
    return [
      { value: RoomType.STANDARD, label: 'Standard Room' },
      { value: RoomType.DELUXE, label: 'Deluxe Room' },
      { value: RoomType.SUITE, label: 'Suite' },
      { value: RoomType.PRESIDENTIAL_SUITE, label: 'Presidential Suite' },
      { value: RoomType.FAMILY_ROOM, label: 'Family Room' },
      { value: RoomType.STUDIO, label: 'Studio' },
      { value: RoomType.JUNIOR_SUITE, label: 'Junior Suite' },
      { value: RoomType.PENTHOUSE, label: 'Penthouse' },
    ];
  }

  /**
   * Get room statuses configuration
   */
  getRoomStatuses(): { value: RoomStatus; label: string; class: string }[] {
    return [
      { value: RoomStatus.AVAILABLE, label: 'Available', class: 'success' },
      { value: RoomStatus.OCCUPIED, label: 'Occupied', class: 'warning' },
      { value: RoomStatus.RESERVED, label: 'Reserved', class: 'info' },
      { value: RoomStatus.MAINTENANCE, label: 'Maintenance', class: 'danger' },
      {
        value: RoomStatus.OUT_OF_ORDER,
        label: 'Out of Order',
        class: 'danger',
      },
      { value: RoomStatus.CLEANING, label: 'Cleaning', class: 'secondary' },
      {
        value: RoomStatus.CHECKOUT_PENDING,
        label: 'Checkout Pending',
        class: 'warning',
      },
      {
        value: RoomStatus.CHECKIN_READY,
        label: 'Check-in Ready',
        class: 'info',
      },
    ];
  }

  /**
   * Get view types configuration
   */
  getViewTypes(): { value: ViewType; label: string }[] {
    return [
      { value: ViewType.CITY, label: 'City View' },
      { value: ViewType.OCEAN, label: 'Ocean View' },
      { value: ViewType.GARDEN, label: 'Garden View' },
      { value: ViewType.MOUNTAIN, label: 'Mountain View' },
      { value: ViewType.POOL, label: 'Pool View' },
      { value: ViewType.COURTYARD, label: 'Courtyard View' },
      { value: ViewType.INTERIOR, label: 'Interior View' },
    ];
  }

  /**
   * Get bed types configuration
   */
  getBedTypes(): { value: BedType; label: string }[] {
    return [
      { value: BedType.SINGLE, label: 'Single Bed' },
      { value: BedType.DOUBLE, label: 'Double Bed' },
      { value: BedType.QUEEN, label: 'Queen Bed' },
      { value: BedType.KING, label: 'King Bed' },
      { value: BedType.TWIN, label: 'Twin Beds' },
      { value: BedType.SOFA_BED, label: 'Sofa Bed' },
      { value: BedType.BUNK_BED, label: 'Bunk Bed' },
    ];
  }

  /**
   * Get default amenities list
   */
  getDefaultAmenities(): string[] {
    return [
      'Wi-Fi',
      'Air Conditioning',
      'Heating',
      'Television',
      'Mini Bar',
      'Safe',
      'Hair Dryer',
      'Iron & Ironing Board',
      'Coffee/Tea Maker',
      'Telephone',
      'Wake-up Service',
      'Daily Housekeeping',
      'Room Service',
      'Laundry Service',
      'Concierge Service',
      'Gym Access',
      'Pool Access',
      'Spa Access',
      'Business Center',
      'Restaurant',
      'Bar',
      'Parking',
      'Pet Friendly',
      'Smoking Allowed',
      'Wheelchair Accessible',
      'Balcony',
      'Kitchen',
      'Living Room',
      'Dining Area',
      'Work Desk',
      'Seating Area',
    ];
  }

  // Utility methods
  clearCache(): void {
    this.roomsCache.clear();
  }

  refreshRooms(): void {
    this.getRooms().subscribe();
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
    console.error('Room Service Error:', error);
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
        errorMessage = 'Room not found';
      } else if (error.status === 500) {
        errorMessage = 'Server error';
      } else {
        errorMessage = `Error Code: ${error.status}`;
      }
    }

    this.setError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private getCacheKey(prefix: string, filters?: any): string {
    return `${prefix}_${JSON.stringify(filters || {})}`;
  }
}
