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
  ViewType
} from 'src/app/core/models/room.model';
import { RoomService } from 'src/app/core/services/RoomService ';
import { NotificationService } from 'src/app/core/services/notification.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';

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
  filteredRooms: Room[] = [];
  statistics: RoomStatistics | null = null;
  selectedRooms: number[] = [];

  // UI State
  loading = false;
  error: string | null = null;
  viewMode: 'grid' | 'list' = 'grid';
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

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  // Sorting
  sortBy = 'roomNumber';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Configuration
  roomTypes = [
    { value: 'STANDARD', label: 'Standard Room' },
    { value: 'DELUXE', label: 'Deluxe Room' },
    { value: 'SUITE', label: 'Suite' },
    { value: 'PRESIDENTIAL_SUITE', label: 'Presidential Suite' },
    { value: 'FAMILY_ROOM', label: 'Family Room' },
    { value: 'STUDIO', label: 'Studio' },
    { value: 'JUNIOR_SUITE', label: 'Junior Suite' },
    { value: 'PENTHOUSE', label: 'Penthouse' }
  ];

  statuses = [
    { value: 'AVAILABLE', label: 'Available', class: 'success' },
    { value: 'OCCUPIED', label: 'Occupied', class: 'warning' },
    { value: 'RESERVED', label: 'Reserved', class: 'info' },
    { value: 'MAINTENANCE', label: 'Maintenance', class: 'danger' },
    { value: 'OUT_OF_ORDER', label: 'Out of Order', class: 'danger' },
    { value: 'CLEANING', label: 'Cleaning', class: 'secondary' },
    { value: 'CHECKOUT_PENDING', label: 'Checkout Pending', class: 'warning' },
    { value: 'CHECKIN_READY', label: 'Check-in Ready', class: 'info' }
  ];

  floors: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  buildings: string[] = ['Main Building', 'North Wing', 'South Wing', 'East Tower', 'West Tower'];

  constructor(
    private router: Router,
    private roomService: RoomService,
    private notificationService: NotificationService,
    private toastService: ToastService
  ) {
    // Initialiser les tableaux pour éviter les erreurs
    this.rooms = [];
    this.filteredRooms = [];
    
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadRooms();
    this.loadStatistics();
    
    // Subscribe to room service observables
    this.roomService.loading$.pipe(takeUntil(this.destroy$)).subscribe(
      loading => this.loading = loading
    );
    
    this.roomService.error$.pipe(takeUntil(this.destroy$)).subscribe(
      error => this.error = error
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data Loading Methods
  loadRooms(): void {
    this.loading = true;
    const filters = this.buildFilters();
    
    this.roomService.getRooms(filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.applyFilters();
        this.loading = false;
        this.error = null;
        
        this.notificationService.addNotification({
          type: 'success',
          title: 'Rooms Loaded',
          message: `Successfully loaded ${rooms.length} rooms`
        });
      },
      error: (error) => {
        console.error('Failed to load rooms:', error);
        this.loading = false;
        this.error = 'Failed to load rooms. Please try again.';
        
        // Initialize with mock data as fallback
        this.initializeMockData();
        
        this.notificationService.addNotification({
          type: 'error',
          title: 'Failed to Load Rooms',
          message: 'Unable to load rooms from server. Using cached data.'
        });
      }
    });
  }

  // Initialize with mock data for development/fallback
  private initializeMockData(): void {
    this.rooms = [
      {
        id: 1,
        roomNumber: '101',
        roomType: RoomType.STANDARD,
        floorNumber: 1,
        building: 'Main Building',
        capacity: 2,
        pricePerNight: 89.99,
        status: RoomStatus.AVAILABLE,
        description: 'Standard room with city view',
        amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar'],
        hasBalcony: false,
        hasKitchen: false,
        accessibility: false,
        viewType: ViewType.CITY,
        bedType: BedType.QUEEN,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        roomNumber: '102',
        roomType: RoomType.DELUXE,
        floorNumber: 1,
        building: 'Main Building',
        capacity: 3,
        pricePerNight: 129.99,
        status: RoomStatus.OCCUPIED,
        description: 'Deluxe room with balcony',
        amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony'],
        hasBalcony: true,
        hasKitchen: false,
        accessibility: false,
        viewType: ViewType.OCEAN,
        bedType: BedType.KING,
        currentGuest: {
          name: 'Ahmed Ben Ali',
          checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          email: 'ahmed.benali@email.com',
          phone: '+213 555 123 456'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        roomNumber: '201',
        roomType: RoomType.SUITE,
        floorNumber: 2,
        building: 'Main Building',
        capacity: 4,
        pricePerNight: 199.99,
        status: RoomStatus.MAINTENANCE,
        description: 'Executive suite with living room',
        amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Kitchen', 'Living Room'],
        hasBalcony: true,
        hasKitchen: true,
        accessibility: true,
        viewType: ViewType.CITY,
        bedType: BedType.KING,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.statistics = {
      total: this.rooms.length,
      available: this.rooms.filter(r => r.status === RoomStatus.AVAILABLE).length,
      occupied: this.rooms.filter(r => r.status === RoomStatus.OCCUPIED).length,
      reserved: this.rooms.filter(r => r.status === RoomStatus.RESERVED).length,
      maintenance: this.rooms.filter(r => r.status === RoomStatus.MAINTENANCE).length,
      outOfOrder: this.rooms.filter(r => r.status === RoomStatus.OUT_OF_ORDER).length,
      cleaning: this.rooms.filter(r => r.status === RoomStatus.CLEANING).length,
      occupancy: this.rooms.length > 0 ? (this.rooms.filter(r => r.status === RoomStatus.OCCUPIED).length / this.rooms.length) * 100 : 0,
      averagePricePerNight: this.rooms.length > 0 ? this.rooms.reduce((sum, room) => sum + room.pricePerNight, 0) / this.rooms.length : 0,
      revenueToday: 2850.75,
      revenueThisMonth: 45230.50,
      byType: {},
      byFloor: {},
      byStatus: {}
    };

    this.applyFilters();
    this.loading = false;
    this.error = null;
  }

  loadStatistics(): void {
    this.roomService.getRoomStatistics().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (error) => {
        console.error('Failed to load statistics:', error);
        // Keep existing statistics or use default
      }
    });
  }

  retryLoad(): void {
    this.error = null;
    this.loadRooms();
    this.loadStatistics();
  }

  // Filter Methods
  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredRooms = this.rooms.filter((room) => {
      const matchesSearch = !this.searchTerm || 
        room.roomNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        room.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        room.building.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.statusFilter || room.status === this.statusFilter;
      const matchesType = !this.typeFilter || room.roomType === this.typeFilter;
      const matchesFloor = !this.floorFilter || room.floorNumber.toString() === this.floorFilter;
      const matchesBuilding = !this.buildingFilter || room.building === this.buildingFilter;
      
      const matchesMinPrice = !this.minPriceFilter || room.pricePerNight >= this.minPriceFilter;
      const matchesMaxPrice = !this.maxPriceFilter || room.pricePerNight <= this.maxPriceFilter;
      
      const matchesOccupancy = !this.occupancyFilter || 
        (this.occupancyFilter === '4' ? room.capacity >= 4 : room.capacity.toString() === this.occupancyFilter);
      
      const matchesBalcony = !this.hasBalconyFilter || room.hasBalcony;

      return matchesSearch && matchesStatus && matchesType && matchesFloor && 
             matchesBuilding && matchesMinPrice && matchesMaxPrice && 
             matchesOccupancy && matchesBalcony;
    });

    this.applySorting();
    this.updatePagination();
  }

  applySorting(): void {
    this.filteredRooms.sort((a, b) => {
      let valueA: any = a[this.sortBy as keyof Room];
      let valueB: any = b[this.sortBy as keyof Room];

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      let result = 0;
      if (valueA < valueB) result = -1;
      else if (valueA > valueB) result = 1;

      return this.sortDirection === 'desc' ? -result : result;
    });
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
      const occupancy = this.occupancyFilter === '4' ? 4 : parseInt(this.occupancyFilter);
      filters.maxOccupancy = occupancy;
    }
    if (this.hasBalconyFilter) filters.hasBalcony = true;

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
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.statusFilter || this.typeFilter || 
              this.floorFilter || this.buildingFilter || this.minPriceFilter || 
              this.maxPriceFilter || this.occupancyFilter || this.hasBalconyFilter);
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
    this.applySorting();
  }

  // Pagination Methods
  updatePagination(): void {
    this.totalElements = this.filteredRooms.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    
    if (this.currentPage >= this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages - 1;
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
    }
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

  get paginatedRooms(): Room[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredRooms.slice(start, end);
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

  toggleAllRoomsSelection(): void {
    if (this.allRoomsSelected()) {
      this.selectedRooms = [];
    } else {
      this.selectedRooms = this.filteredRooms.map(room => room.id);
    }
  }

  allRoomsSelected(): boolean {
    return this.filteredRooms.length > 0 && 
           this.filteredRooms.every(room => this.selectedRooms.includes(room.id));
  }

  someRoomsSelected(): boolean {
    return this.selectedRooms.length > 0 && !this.allRoomsSelected();
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

  // Room Operations
  changeRoomStatus(id: number, newStatus: string): void {
    const room = this.rooms.find(r => r.id === id);
    const roomNumber = room?.roomNumber || id.toString();
    
    this.roomService.changeRoomStatus(id, newStatus as any).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedRoom) => {
        const roomIndex = this.rooms.findIndex(r => r.id === id);
        if (roomIndex > -1) {
          this.rooms[roomIndex] = updatedRoom;
          this.applyFilters();
          this.loadStatistics();
        }
        
        this.notificationService.addNotification({
          type: 'success',
          title: 'Room Status Updated',
          message: `Room ${roomNumber} status changed to ${this.getStatusLabel(newStatus)}`
        });
        
        this.toastService.success(
          `Room ${roomNumber} status changed to ${this.getStatusLabel(newStatus)}`,
          'Status Updated'
        );
      },
      error: (error) => {
        console.error('Failed to update room status:', error);
        this.notificationService.addNotification({
          type: 'error',
          title: 'Failed to Update Status',
          message: `Unable to update status for Room ${roomNumber}`
        });
        
        this.toastService.error(
          `Unable to update status for Room ${roomNumber}`,
          'Update Failed'
        );
        
        // Fallback to local update for development
        const room = this.rooms.find(r => r.id === id);
        if (room) {
          room.status = newStatus as any;
          this.applyFilters();
        }
      }
    });
  }

  deleteRoom(id: number): void {
    const room = this.rooms.find(r => r.id === id);
    const roomNumber = room?.roomNumber || id.toString();
    
    if (confirm('Are you sure you want to delete this room?')) {
      this.roomService.deleteRoom(id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.rooms = this.rooms.filter(r => r.id !== id);
          this.selectedRooms = this.selectedRooms.filter(roomId => roomId !== id);
          this.applyFilters();
          this.loadStatistics();
          
          this.notificationService.addNotification({
            type: 'success',
            title: 'Room Deleted',
            message: `Room ${roomNumber} has been successfully deleted`
          });
          
          this.toastService.success(
            `Room ${roomNumber} has been successfully deleted`,
            'Room Deleted'
          );
        },
        error: (error) => {
          console.error('Failed to delete room:', error);
          this.notificationService.addNotification({
            type: 'error',
            title: 'Failed to Delete Room',
            message: `Unable to delete Room ${roomNumber}`
          });
          
          // Fallback to local deletion for development
          this.rooms = this.rooms.filter(r => r.id !== id);
          this.selectedRooms = this.selectedRooms.filter(roomId => roomId !== id);
          this.applyFilters();
        }
      });
    }
  }

  // Bulk Operations
  bulkChangeStatus(status: string): void {
    if (this.selectedRooms.length === 0) return;

    const confirmMessage = `Are you sure you want to change ${this.selectedRooms.length} room(s) status to ${status}?`;
    if (confirm(confirmMessage)) {
      this.roomService.bulkUpdateStatus(this.selectedRooms, status as any).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          // Update local data
          this.selectedRooms.forEach(roomId => {
            const room = this.rooms.find(r => r.id === roomId);
            if (room) {
              room.status = status as any;
            }
          });
          const selectedCount = this.selectedRooms.length;
          this.selectedRooms = [];
          this.applyFilters();
          this.loadStatistics();
          
          this.notificationService.addNotification({
            type: 'success',
            title: 'Bulk Status Update',
            message: `Successfully updated ${selectedCount} rooms to ${this.getStatusLabel(status)}`
          });
        },
        error: (error) => {
          console.error('Failed to bulk update room status:', error);
          this.notificationService.addNotification({
            type: 'error',
            title: 'Bulk Update Failed',
            message: `Failed to update status for ${this.selectedRooms.length} rooms`
          });
          
          // Fallback to local update for development
          this.selectedRooms.forEach(roomId => {
            const room = this.rooms.find(r => r.id === roomId);
            if (room) {
              room.status = status as any;
            }
          });
          this.selectedRooms = [];
          this.applyFilters();
        }
      });
    }
  }

  bulkDelete(): void {
    if (this.selectedRooms.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${this.selectedRooms.length} room(s)? This action cannot be undone.`;
    if (confirm(confirmMessage)) {
      const roomsToDelete = this.selectedRooms.length;
      
      this.roomService.bulkDelete(this.selectedRooms).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.rooms = this.rooms.filter(r => !this.selectedRooms.includes(r.id));
          this.selectedRooms = [];
          this.applyFilters();
          this.loadStatistics();
          
          this.notificationService.addNotification({
            type: 'success',
            title: 'Bulk Delete Completed',
            message: `Successfully deleted ${roomsToDelete} rooms`
          });
        },
        error: (error) => {
          console.error('Failed to bulk delete rooms:', error);
          this.notificationService.addNotification({
            type: 'error',
            title: 'Bulk Delete Failed',
            message: `Failed to delete ${roomsToDelete} rooms`
          });
          
          // Fallback to local deletion for development
          this.rooms = this.rooms.filter(r => !this.selectedRooms.includes(r.id));
          this.selectedRooms = [];
          this.applyFilters();
        }
      });
    }
  }

  // Export Operations
  exportRooms(): void {
    if (this.filteredRooms.length === 0) {
      this.notificationService.addNotification({
        type: 'warning',
        title: 'No Data to Export',
        message: 'There are no rooms to export with the current filters'
      });
      return;
    }

    const exportData = this.filteredRooms.map(room => ({
      'Room Number': room.roomNumber,
      'Type': this.getRoomTypeLabel(room.roomType),
      'Status': this.getStatusLabel(room.status),
      'Floor': room.floorNumber,
      'Building': room.building,
      'Max Occupancy': room.capacity,
      'Price/Night': room.pricePerNight,
      'Description': room.description,
      'Amenities': room.amenities.join(', '),
      'Has Balcony': room.hasBalcony ? 'Yes' : 'No',
      'Has Kitchen': room.hasKitchen ? 'Yes' : 'No',
      'Accessibility': room.accessibility ? 'Yes' : 'No',
      'View Type': room.viewType,
      'Bed Type': room.bedType,
      'Current Guest': room.currentGuest?.name || '',
      'Guest Check-out': room.currentGuest?.checkOut ? new Date(room.currentGuest.checkOut).toLocaleDateString() : ''
    }));

    this.downloadCSV(exportData, 'rooms-export');
    
    this.notificationService.addNotification({
      type: 'success',
      title: 'Export Completed',
      message: `Successfully exported ${exportData.length} rooms to CSV`
    });
  }

  private downloadCSV(data: any[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma or quote
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Refresh
  refreshData(): void {
    this.loadRooms();
    this.loadStatistics();
  }
}