// src/app/core/services/room.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
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
  BedType
} from '../models/room.model';
import { PagedApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
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
   * Get all rooms with optional filters
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
      if (filters.search) params = params.set('search', filters.search);
      if (filters.roomType) params = params.set('roomType', filters.roomType);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.floorNumber) params = params.set('floorNumber', filters.floorNumber.toString());
      if (filters.building) params = params.set('building', filters.building);
      if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
      if (filters.hasBalcony !== undefined) params = params.set('hasBalcony', filters.hasBalcony.toString());
      if (filters.hasKitchen !== undefined) params = params.set('hasKitchen', filters.hasKitchen.toString());
      if (filters.accessibility !== undefined) params = params.set('accessibility', filters.accessibility.toString());
      if (filters.viewType) params = params.set('viewType', filters.viewType);
      if (filters.bedType) params = params.set('bedType', filters.bedType);
      if (filters.maxOccupancy) params = params.set('maxOccupancy', filters.maxOccupancy.toString());
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        // Gérer les différents formats de réponse
        if (Array.isArray(response)) {
          return response;
        } else if (response && response.content && Array.isArray(response.content)) {
          return response.content;
        } else if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        } else {
          console.warn('Unexpected response format:', response);
          return [];
        }
      }),
      tap(rooms => {
        this.roomsSubject.next(rooms);
        this.roomsCache.set(cacheKey, { data: rooms, timestamp: Date.now() });
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get paginated rooms
   */
  getRoomsPaged(
    page = 0,
    size = 5,
    sortBy = 'roomNumber',
    sortDir = 'asc',
    filters?: RoomFilters
  ): Observable<PagedApiResponse<Room>['data']> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortBy},${sortDir}`);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.roomType) params = params.set('roomType', filters.roomType);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.floorNumber) params = params.set('floorNumber', filters.floorNumber.toString());
      if (filters.building) params = params.set('building', filters.building);
      if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
    }

    this.setLoading(true);
    return this.http.get<PagedApiResponse<Room>>(`${this.apiUrl}/paged`, { params }).pipe(
      map(response => response.data),
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get room by ID
   */
  getRoomById(id: number): Observable<Room> {
    this.setLoading(true);
    return this.http.get<Room>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Create new room
   */
  createRoom(room: RoomCreateRequest): Observable<Room> {
    this.setLoading(true);
    return this.http.post<Room>(this.apiUrl, room).pipe(
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshRooms();
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Update room
   */
  updateRoom(id: number, room: RoomUpdateRequest): Observable<Room> {
    this.setLoading(true);
    return this.http.put<Room>(`${this.apiUrl}/${id}`, room).pipe(
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshRooms();
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Delete room
   */
  deleteRoom(id: number): Observable<void> {
    this.setLoading(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.clearCache();
        this.setLoading(false);
        this.refreshRooms();
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Change room status
   */
  changeRoomStatus(id: number, status: RoomStatus): Observable<Room> {
    return this.http.patch<Room>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      tap(() => {
        this.clearCache();
        this.refreshRooms();
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get room statistics
   */
  getRoomStatistics(): Observable<RoomStatistics> {
    return this.http.get<RoomStatistics>(`${this.apiUrl}/statistics`).pipe(
      catchError(error => {
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
          byStatus: {}
        });
      })
    );
  }

  /**
   * Check room availability
   */
  checkAvailability(roomId: number, checkIn: Date, checkOut: Date): Observable<RoomAvailability> {
    const params = new HttpParams()
      .set('checkIn', checkIn.toISOString())
      .set('checkOut', checkOut.toISOString());

    return this.http.get<RoomAvailability>(`${this.apiUrl}/${roomId}/availability`, { params }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get maintenance records for a room
   */
  getRoomMaintenance(roomId: number): Observable<MaintenanceRecord[]> {
    return this.http.get<MaintenanceRecord[]>(`${this.apiUrl}/${roomId}/maintenance`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Schedule maintenance for a room
   */
  scheduleMaintenance(roomId: number, maintenance: Partial<MaintenanceRecord>): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceRecord>(`${this.apiUrl}/${roomId}/maintenance`, maintenance).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get available rooms for a date range
   */
  getAvailableRooms(checkIn: Date, checkOut: Date, guestCount?: number): Observable<Room[]> {
    let params = new HttpParams()
      .set('checkIn', checkIn.toISOString())
      .set('checkOut', checkOut.toISOString());

    if (guestCount) {
      params = params.set('guestCount', guestCount.toString());
    }

    return this.http.get<Room[]>(`${this.apiUrl}/available`, { params }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Bulk operations
   */
  bulkUpdateStatus(roomIds: number[], status: RoomStatus): Observable<any> {
    return this.http.patch(`${this.apiUrl}/bulk/status`, { roomIds, status }).pipe(
      tap(() => {
        this.clearCache();
        this.refreshRooms();
      }),
      catchError(error => this.handleError(error))
    );
  }

  bulkDelete(roomIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk/delete`, { roomIds }).pipe(
      tap(() => {
        this.clearCache();
        this.refreshRooms();
      }),
      catchError(error => this.handleError(error))
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
      { value: RoomType.PENTHOUSE, label: 'Penthouse' }
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
      { value: RoomStatus.OUT_OF_ORDER, label: 'Out of Order', class: 'danger' },
      { value: RoomStatus.CLEANING, label: 'Cleaning', class: 'secondary' },
      { value: RoomStatus.CHECKOUT_PENDING, label: 'Checkout Pending', class: 'warning' },
      { value: RoomStatus.CHECKIN_READY, label: 'Check-in Ready', class: 'info' }
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
      { value: ViewType.INTERIOR, label: 'Interior View' }
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
      { value: BedType.BUNK_BED, label: 'Bunk Bed' }
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
      'Seating Area'
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

  private handleError(error: any): Observable<never> {
    console.error('Room Service Error:', error);
    this.setLoading(false);
    
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || `Error Code: ${error.status}`;
    }
    
    this.setError(errorMessage);
    throw error;
  }

  private getCacheKey(prefix: string, filters?: any): string {
    return `${prefix}_${JSON.stringify(filters || {})}`;
  }
}