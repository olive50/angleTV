import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  BedType,
  Room,
  RoomFilters,
  RoomStatistics,
  RoomStatus,
  RoomType,
  ViewType,
} from 'src/app/core/models/room.model';

import { NotificationService } from 'src/app/core/services/notification.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { SpringBootPageResponse } from 'src/app/core/models/api-response.model';
import { RoomService } from 'src/app/core/services/room.service';

@Component({
  selector: 'app-rooms-list',
  templateUrl: './rooms-list.component.html',
  styleUrls: ['./rooms-list.component.css'],
})
export class RoomsListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data
  rooms: Room[] = [];
  selectedRooms: number[] = [];
  statistics: RoomStatistics | null = null;

  // UI State
  loading = false;
  error: string | null = null;
  viewMode: 'grid' | 'list' = 'list'; // Changed default to 'list'
  showAdvancedFilters = false;

  // Filters
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';
  floorFilter = '';
  buildingFilter = '';
  minPriceFilter: number | null = null;
  maxPriceFilter: number | null = null;
  occupancyFilter = '';
  hasBalconyFilter = false;

  // Pagination - Spring Boot
  currentPage = 0;
  pageSize = 23;
  totalPages = 0;
  totalElements = 0;
  numberOfElements = 0;
  isFirst = true;
  isLast = false;

  // Sorting
  // sortBy = 'roomNumber';
  sortBy = 'floorNumber';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Configuration
  roomTypes = [
    { value: RoomType.STANDARD, label: 'Standard Room' },
    { value: RoomType.DELUXE, label: 'Deluxe Room' },
    { value: RoomType.SUITE, label: 'Suite' },
    { value: RoomType.PRESIDENTIAL_SUITE, label: 'Presidential Suite' },
    { value: RoomType.FAMILY_ROOM, label: 'Family Room' },
    { value: RoomType.STUDIO, label: 'Studio' },
    { value: RoomType.JUNIOR_SUITE, label: 'Junior Suite' },
    { value: RoomType.PENTHOUSE, label: 'Penthouse' },
  ];

  statuses = [
    { value: 'AVAILABLE', label: 'Available', class: 'success' },
    { value: 'OCCUPIED', label: 'Occupied', class: 'warning' },
    { value: 'RESERVED', label: 'Reserved', class: 'info' },
    { value: 'MAINTENANCE', label: 'Maintenance', class: 'danger' },
    { value: 'OUT_OF_ORDER', label: 'Out of Order', class: 'danger' },
    { value: 'CLEANING', label: 'Cleaning', class: 'secondary' },
    { value: 'CHECKOUT_PENDING', label: 'Checkout Pending', class: 'warning' },
    { value: 'CHECKIN_READY', label: 'Check-in Ready', class: 'info' },
  ];

  floors: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  buildings: string[] = [
    'Main Building',
    'North Wing',
    'South Wing',
    'East Tower',
    'West Tower',
  ];

  constructor(
    private router: Router,
    private roomService: RoomService,
    private notificationService: NotificationService,
    private toastService: ToastService
  ) {
    // Setup search debouncing
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.currentPage = 0;
        this.loadRoomsPaged();
      });
  }

  ngOnInit(): void {
    this.loadRoomsPaged();
    this.loadStatistics();

    // Subscribe to room service observables
    this.roomService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => (this.loading = loading));

    this.roomService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => (this.error = error));

    // Add keyboard navigation event listener
    document.addEventListener('keydown', this.onKeyboardNavigation.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener(
      'keydown',
      this.onKeyboardNavigation.bind(this)
    );
  }

  // Data Loading Methods - Uses real RoomService with TvBootHttpResponse
  loadRoomsPaged(): void {
    const filters = this.buildFilters();

    this.roomService
      .getRoomsPaged(
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection,
        filters
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SpringBootPageResponse<Room>) => {
          // Update data with Spring Boot response
          this.rooms = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.numberOfElements = response.numberOfElements;
          this.currentPage = response.number;
          this.isFirst = response.first;
          this.isLast = response.last;

          console.log('✅ Rooms loaded successfully:', {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            totalElements: this.totalElements,
            numberOfElements: this.numberOfElements,
            pageSize: response.size,
          });

          this.notificationService.addNotification({
            type: 'success',
            title: 'Rooms Loaded',
            message: `Successfully loaded ${this.numberOfElements} of ${this.totalElements} rooms`,
          });
        },
        error: (error) => {
          console.error('❌ Failed to load rooms:', error);

          this.notificationService.addNotification({
            type: 'error',
            title: 'Failed to Load Rooms',
            message:
              'Unable to load rooms from server. Please check your connection.',
          });

          this.toastService.error(
            'Unable to load rooms from server',
            'Connection Error'
          );
        },
      });
  }

  loadStatistics(): void {
    this.roomService
      .getRoomStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.statistics = stats;
          console.log('📊 Statistics loaded:', stats);
        },
        error: (error) => {
          console.error('Failed to load statistics:', error);
          // Use fallback statistics
          this.statistics = {
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
          };
        },
      });
  }

  // Filter Methods
  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadRoomsPaged();
  }

  buildFilters(): RoomFilters {
    const filters: RoomFilters = {};

    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.statusFilter) filters.status = this.statusFilter as any;
    if (this.typeFilter) filters.roomType = this.typeFilter as any;
    if (this.floorFilter) filters.floorNumber = parseInt(this.floorFilter);
    if (this.buildingFilter) filters.building = this.buildingFilter;
    if (this.minPriceFilter) filters.minPrice = this.minPriceFilter;
    if (this.maxPriceFilter) filters.maxPrice = this.maxPriceFilter;
    if (this.occupancyFilter) {
      const occupancy =
        this.occupancyFilter === '4' ? 4 : parseInt(this.occupancyFilter);
      filters.capacity = occupancy;
    }

    return filters;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.floorFilter = '';
    this.buildingFilter = '';
    this.minPriceFilter = null;
    this.maxPriceFilter = null;
    this.occupancyFilter = '';
    this.hasBalconyFilter = false;
    this.showAdvancedFilters = false;
    this.currentPage = 0;

    this.loadRoomsPaged();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.statusFilter ||
      this.typeFilter ||
      this.floorFilter ||
      this.buildingFilter ||
      this.minPriceFilter ||
      this.maxPriceFilter ||
      this.occupancyFilter ||
      this.hasBalconyFilter
    );
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // View Methods
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  // Sorting Methods
  sort(field: string): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 0;
    this.loadRoomsPaged();
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) {
      return 'fa-sort text-muted';
    }
    return this.sortDirection === 'asc'
      ? 'fa-sort-up text-primary'
      : 'fa-sort-down text-primary';
  }

  // Pagination Methods
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadRoomsPaged();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadRoomsPaged();
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(0, this.currentPage - half);
    let end = Math.min(this.totalPages - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Selection Methods
  isRoomSelected(roomId: number): boolean {
    return this.selectedRooms.includes(roomId);
  }

  toggleRoomSelection(roomId: number): void {
    const index = this.selectedRooms.indexOf(roomId);
    if (index > -1) {
      this.selectedRooms.splice(index, 1);
    } else {
      this.selectedRooms.push(roomId);
    }
  }

  allRoomsSelected(): boolean {
    return (
      this.rooms.length > 0 &&
      this.rooms.every((room) => this.selectedRooms.includes(room.id))
    );
  }

  someRoomsSelected(): boolean {
    return this.selectedRooms.length > 0 && !this.allRoomsSelected();
  }

  toggleAllRoomsSelection(): void {
    if (this.allRoomsSelected()) {
      this.rooms.forEach((room) => {
        const index = this.selectedRooms.indexOf(room.id);
        if (index > -1) {
          this.selectedRooms.splice(index, 1);
        }
      });
    } else {
      this.rooms.forEach((room) => {
        if (!this.selectedRooms.includes(room.id)) {
          this.selectedRooms.push(room.id);
        }
      });
    }
  }

  // Keyboard navigation
  onKeyboardNavigation(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        if (!this.isFirst) {
          this.goToPage(this.currentPage - 1);
          event.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (!this.isLast) {
          this.goToPage(this.currentPage + 1);
          event.preventDefault();
        }
        break;
      case 'Home':
        if (!this.isFirst) {
          this.goToPage(0);
          event.preventDefault();
        }
        break;
      case 'End':
        if (!this.isLast) {
          this.goToPage(this.totalPages - 1);
          event.preventDefault();
        }
        break;
    }
  }

  // Utility Methods
  getStatusClass(status: string): string {
    const statusObj = this.statuses.find((s) => s.value === status);
    return statusObj ? statusObj.class : 'secondary';
  }

  getStatusLabel(status: string): string {
    const statusObj = this.statuses.find((s) => s.value === status);
    return statusObj ? statusObj.label : status;
  }

  getRoomTypeLabel(type: string): string {
    const typeObj = this.roomTypes.find((t) => t.value === type);
    return typeObj ? typeObj.label : type;
  }

  trackByRoomId(index: number, room: Room): number {
    return room.id;
  }

  trackByPageNumber(index: number, page: number): number {
    return page;
  }

  // Navigation Methods
  viewRoom(id: number): void {
    this.router.navigate(['/rooms', id]);
  }

  editRoom(id: number): void {
    this.router.navigate(['/rooms', id, 'edit']);
  }

  addRoom(): void {
    this.router.navigate(['/rooms/add']);
  }

  // Status Management Methods
  manageRoomStatus(roomId: number): void {
    this.router.navigate(['/rooms/status-management'], {
      queryParams: { selectedRooms: roomId.toString() },
    });
  }

  bulkManageStatus(): void {
    if (this.selectedRooms.length === 0) {
      this.toastService.warning(
        'Please select at least one room',
        'No Rooms Selected'
      );
      return;
    }

    this.router.navigate(['/rooms/status-management'], {
      queryParams: { selectedRooms: this.selectedRooms.join(',') },
    });
  }

  navigateToStatusManagement(): void {
    this.router.navigate(['/rooms/status-management']);
  }

  // Room Operations
  deleteRoom(id: number): void {
    const room = this.rooms.find((r) => r.id === id);
    const roomNumber = room?.roomNumber || id.toString();

    if (
      confirm(
        'Are you sure you want to delete this room? This action cannot be undone.'
      )
    ) {
      this.roomService
        .deleteRoom(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.selectedRooms = this.selectedRooms.filter(
              (roomId) => roomId !== id
            );
            this.loadRoomsPaged();
            this.loadStatistics();

            this.notificationService.addNotification({
              type: 'success',
              title: 'Room Deleted',
              message: `Room ${roomNumber} has been successfully deleted`,
            });

            this.toastService.success(
              `Room ${roomNumber} has been successfully deleted`,
              'Room Deleted'
            );
          },
          error: (error) => {
            console.error('Failed to delete room:', error);
            this.toastService.error(
              `Failed to delete room ${roomNumber}`,
              'Delete Failed'
            );
          },
        });
    }
  }

  bulkDelete(): void {
    if (this.selectedRooms.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${this.selectedRooms.length} room(s)? This action cannot be undone.`;
    if (confirm(confirmMessage)) {
      const roomsToDelete = this.selectedRooms.length;

      this.roomService
        .bulkDelete(this.selectedRooms)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.selectedRooms = [];
            this.loadRoomsPaged();
            this.loadStatistics();

            this.notificationService.addNotification({
              type: 'success',
              title: 'Bulk Delete Completed',
              message: `Successfully deleted ${roomsToDelete} rooms`,
            });

            this.toastService.success(
              `Successfully deleted ${roomsToDelete} rooms`,
              'Bulk Delete Completed'
            );
          },
          error: (error) => {
            console.error('Failed to bulk delete rooms:', error);
            this.toastService.error(
              'Failed to delete selected rooms',
              'Bulk Delete Failed'
            );
          },
        });
    }
  }

  // Export Operations
  exportRooms(): void {
    this.toastService.info(
      'Export functionality would export all filtered data',
      'Export Info'
    );
  }

  // Status Summary
  getStatusSummary(): string {
    if (!this.statistics) return '';

    const { available, occupied, maintenance, cleaning } = this.statistics;
    const maintenanceTotal = (maintenance || 0) + (cleaning || 0);
    return `${available || 0} Available • ${
      occupied || 0
    } Occupied • ${maintenanceTotal} Maintenance • Total: ${
      this.totalElements
    }`;
  }

  // Debug Methods
  testPagination(): void {
    console.table({
      'Current Page': this.currentPage + 1,
      'Total Pages': this.totalPages,
      'Page Size': this.pageSize,
      'Total Elements': this.totalElements,
      'Elements on Page': this.numberOfElements,
      'Is First': this.isFirst,
      'Is Last': this.isLast,
      'Sort By': this.sortBy,
      'Sort Direction': this.sortDirection,
    });

    // Test API call
    console.log('🔍 Testing API call...');
    this.roomService.getRoomStatistics().subscribe({
      next: (stats) => console.log('📊 API Statistics:', stats),
      error: (err) => console.error('❌ API Error:', err),
    });
  }

  retryLoad(): void {
    this.error = null;
    this.loadRoomsPaged();
    this.loadStatistics();
  }
}
