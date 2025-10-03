import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ConnectivityTestResult,
  PagedTerminalResponse,
  PaginationData,
  Terminal,
  TerminalCreateRequest,
  TerminalSearchCriteria,
  TerminalStats,
  TerminalUpdateRequest,
  TvBootHttpResponse,
} from '../models/terminal.model';

// Models

@Injectable({
  providedIn: 'root',
})
export class TerminalService {
  private baseUrl = `${environment.apiUrl}/terminals`;
  private terminalsSubject = new BehaviorSubject<Terminal[]>([]);
  private statsSubject = new BehaviorSubject<TerminalStats | null>(null);

  public terminals$ = this.terminalsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all terminals
  getAllTerminals(): Observable<Terminal[]> {
    return this.http
      .get<TvBootHttpResponse<{ terminals: Terminal[]; count: number }>>(
        this.baseUrl
      )
      .pipe(
        map((response) => response.data?.terminals || []),
        tap((terminals) => this.terminalsSubject.next(terminals)),
        catchError(this.handleError)
      );
  }

  // Get paginated terminals
  getTerminalsPaged(
    page: number = 0,
    size: number = 20,
    sort: string = 'terminalCode',
    direction: string = 'asc',
    criteria?: TerminalSearchCriteria
  ): Observable<PagedTerminalResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);

    if (criteria) {
      if (criteria.search) params = params.set('search', criteria.search);
      if (criteria.status) params = params.set('status', criteria.status);
      if (criteria.deviceType)
        params = params.set('deviceType', criteria.deviceType);
      if (criteria.location) params = params.set('location', criteria.location);
      if (criteria.roomId)
        params = params.set('roomId', criteria.roomId.toString());
    }

    return this.http
      .get<
        TvBootHttpResponse<{
          terminals: Terminal[];
          pagination: PaginationData;
        }>
      >(`${this.baseUrl}`, { params })
      .pipe(
        map((response) => ({
          terminals: response.data?.terminals || [],
          pagination: response.data?.pagination || this.getDefaultPagination(),
        })),
        catchError(this.handleError)
      );
  }

  // Get terminal by ID
  getTerminalById(id: number): Observable<Terminal> {
    return this.http
      .get<TvBootHttpResponse<{ terminal: Terminal }>>(`${this.baseUrl}/${id}`)
      .pipe(
        map((response) => response.data?.terminal!),
        catchError(this.handleError)
      );
  }

  // Create terminal
  createTerminal(request: TerminalCreateRequest): Observable<Terminal> {
    return this.http
      .post<TvBootHttpResponse<{ terminal: Terminal }>>(this.baseUrl, request)
      .pipe(
        map((response) => response.data?.terminal!),
        tap(() => this.refreshTerminals()),
        catchError(this.handleError)
      );
  }

  // Update terminal
  updateTerminal(
    id: number,
    request: TerminalUpdateRequest
  ): Observable<Terminal> {
    return this.http
      .put<TvBootHttpResponse<{ terminal: Terminal }>>(
        `${this.baseUrl}/${id}`,
        request
      )
      .pipe(
        map((response) => response.data?.terminal!),
        tap(() => this.refreshTerminals()),
        catchError(this.handleError)
      );
  }

  // Delete terminal
  deleteTerminal(id: number): Observable<void> {
    return this.http
      .delete<TvBootHttpResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.refreshTerminals()),
        catchError(this.handleError)
      );
  }

  // Test terminal connectivity
  testTerminalConnectivity(id: number): Observable<ConnectivityTestResult> {
    return this.http
      .post<TvBootHttpResponse<{ connectivityResult: ConnectivityTestResult }>>(
        `${this.baseUrl}/${id}/test-connectivity`,
        {}
      )
      .pipe(
        map((response) => response.data?.connectivityResult!),
        catchError(this.handleError)
      );
  }

  // Get terminal connectivity
  getTerminalConnectivity(id: number): Observable<ConnectivityTestResult> {
    return this.http
      .get<TvBootHttpResponse<{ connectivityResult: ConnectivityTestResult }>>(
        `${this.baseUrl}/${id}/connectivity`
      )
      .pipe(
        map((response) => response.data?.connectivityResult!),
        catchError(this.handleError)
      );
  }

  // Reboot terminal
  rebootTerminal(id: number): Observable<void> {
    return this.http
      .post<TvBootHttpResponse<{ terminalId: number }>>(
        `${this.baseUrl}/${id}/reboot`,
        {}
      )
      .pipe(
        map(() => void 0),
        tap(() => this.refreshTerminals()),
        catchError(this.handleError)
      );
  }

  // Get terminal statistics
  getTerminalStatistics(): Observable<TerminalStats> {
    return this.http
      .get<TvBootHttpResponse<{ statistics: TerminalStats }>>(
        `${this.baseUrl}/stats`
      )
      .pipe(
        map((response) => response.data?.statistics!),
        tap((stats) => this.statsSubject.next(stats)),
        catchError(this.handleError)
      );
  }

  // Update terminal heartbeat
  updateTerminalHeartbeat(macAddress: string): Observable<void> {
    const params = new HttpParams().set('macAddress', macAddress);
    return this.http
      .post<TvBootHttpResponse<{ macAddress: string }>>(
        `${this.baseUrl}/heartbeat`,
        {},
        { params }
      )
      .pipe(
        map(() => void 0),
        catchError(this.handleError)
      );
  }

  // Authorize device
  authorizeDevice(id: number): Observable<Terminal> {
    return this.http
      .post<TvBootHttpResponse<{ device: Terminal }>>(
        `${this.baseUrl}/${id}/authorize`,
        {}
      )
      .pipe(
        map((response) => response.data?.device!),
        catchError(this.handleError)
      );
  }

  // Get terminals by room
  getTerminalsByRoom(
    roomId: number,
    page: number = 0,
    size: number = 20
  ): Observable<PagedTerminalResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<
        TvBootHttpResponse<{
          terminals: Terminal[];
          pagination: PaginationData;
        }>
      >(`${this.baseUrl}/room/${roomId}`, { params })
      .pipe(
        map((response) => ({
          terminals: response.data?.terminals || [],
          pagination: response.data?.pagination || this.getDefaultPagination(),
        })),
        catchError(this.handleError)
      );
  }

  // Get terminals by device type
  getTerminalsByDeviceType(
    deviceType: string,
    page: number = 0,
    size: number = 20
  ): Observable<PagedTerminalResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<
        TvBootHttpResponse<{
          terminals: Terminal[];
          pagination: PaginationData;
        }>
      >(`${this.baseUrl}/type/${deviceType}`, { params })
      .pipe(
        map((response) => ({
          terminals: response.data?.terminals || [],
          pagination: response.data?.pagination || this.getDefaultPagination(),
        })),
        catchError(this.handleError)
      );
  }

  // Utility methods
  private refreshTerminals(): void {
    this.getAllTerminals().subscribe();
    this.getTerminalStatistics().subscribe();
  }

  private getDefaultPagination(): PaginationData {
    return {
      page: 0,
      size: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.developerMessage) {
        errorMessage = error.error.developerMessage;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error('Terminal Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  // Helper methods for UI
  getDeviceTypeOptions() {
    return [
      { value: 'SET_TOP_BOX', label: 'Set Top Box', icon: 'fas fa-tv' },
      { value: 'SMART_TV', label: 'Smart TV', icon: 'fas fa-television' },
      { value: 'DESKTOP_PC', label: 'Desktop PC', icon: 'fas fa-desktop' },
      { value: 'TABLET', label: 'Tablet', icon: 'fas fa-tablet-alt' },
      { value: 'MOBILE', label: 'Mobile', icon: 'fas fa-mobile-alt' },
      {
        value: 'DISPLAY_SCREEN',
        label: 'Display Screen',
        icon: 'fas fa-monitor',
      },
    ];
  }

  getStatusOptions() {
    return [
      { value: 'ACTIVE', label: 'Active', class: 'success' },
      { value: 'INACTIVE', label: 'Inactive', class: 'secondary' },
      { value: 'MAINTENANCE', label: 'Maintenance', class: 'warning' },
      { value: 'OFFLINE', label: 'Offline', class: 'danger' },
      { value: 'FAULTY', label: 'Faulty', class: 'danger' },
    ];
  }
}
