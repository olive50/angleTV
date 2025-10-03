import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  Room,
  RoomStatus,
  RoomStatistics,
} from 'src/app/core/models/room.model';
import { RoomService } from 'src/app/core/services/room.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';

@Component({
  selector: 'app-room-status',
  templateUrl: './room-status.component.html',
  styleUrls: ['./room-status.component.css'],
})
export class RoomStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Expose enum for template
  RoomStatus = RoomStatus;

  // Data
  rooms: Room[] = [];
  filteredRooms: Room[] = [];
  selectedRooms: number[] = [];
  statistics: RoomStatistics | null = null;

  // UI State
  loading = false;
  error: string | null = null;
  searchTerm = '';
  selectedStatus = '';
  showOnlySelected = false;

  // Filters
  statusFilters = [
    { value: '', label: 'All Statuses', class: 'secondary' },
    { value: 'AVAILABLE', label: 'Available', class: 'success' },
    { value: 'OCCUPIED', label: 'Occupied', class: 'warning' },
    { value: 'RESERVED', label: 'Reserved', class: 'info' },
    { value: 'MAINTENANCE', label: 'Maintenance', class: 'danger' },
    { value: 'OUT_OF_ORDER', label: 'Out of Order', class: 'danger' },
    { value: 'CLEANING', label: 'Cleaning', class: 'secondary' },
    { value: 'CHECKOUT_PENDING', label: 'Checkout Pending', class: 'warning' },
    { value: 'CHECKIN_READY', label: 'Check-in Ready', class: 'info' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roomService: RoomService,
    private notificationService: NotificationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadRooms();
    this.loadStatistics();

    // Check for pre-selected rooms from route params
    this.route.queryParams.subscribe((params) => {
      if (params['selectedRooms']) {
        const roomIds = params['selectedRooms']
          .split(',')
          .map((id: string) => parseInt(id));
        this.selectedRooms = roomIds;
        this.showOnlySelected = true;
        this.applyFilters();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data Loading
  loadRooms(): void {
    this.loading = true;
    this.roomService
      .getRooms()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rooms: Room[]) => {
          this.rooms = rooms;
          this.applyFilters();
          this.loading = false;
          this.error = null;
        },
        error: (error) => {
          console.error('Failed to load rooms:', error);
          this.loading = false;
          this.error = 'Failed to load rooms. Please try again.';
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
        },
        error: (error) => {
          console.error('Failed to load statistics:', error);
        },
      });
  }

  // Filtering
  applyFilters(): void {
    this.filteredRooms = this.rooms.filter((room) => {
      const matchesSearch =
        !this.searchTerm ||
        room.roomNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        room.building.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus =
        !this.selectedStatus || room.status === this.selectedStatus;

      const matchesSelection =
        !this.showOnlySelected || this.selectedRooms.includes(room.id);

      return matchesSearch && matchesStatus && matchesSelection;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.showOnlySelected = false;
    this.applyFilters();
  }

  // Room Selection
  toggleRoomSelection(roomId: number): void {
    const index = this.selectedRooms.indexOf(roomId);
    if (index > -1) {
      this.selectedRooms.splice(index, 1);
    } else {
      this.selectedRooms.push(roomId);
    }
  }

  isRoomSelected(roomId: number): boolean {
    return this.selectedRooms.includes(roomId);
  }

  // Status Management
  changeRoomStatus(roomId: number, event: any): void {
    const newStatus = event.target.value as RoomStatus;

    this.roomService
      .changeRoomStatus(roomId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedRoom) => {
          const roomIndex = this.rooms.findIndex((r) => r.id === roomId);
          if (roomIndex > -1) {
            this.rooms[roomIndex] = updatedRoom;
          }
          this.applyFilters();
          this.loadStatistics();

          const room = this.rooms.find((r) => r.id === roomId);
          this.toastService.success(
            `Room ${room?.roomNumber} status updated to ${this.getStatusLabel(
              newStatus
            )}`,
            'Status Updated'
          );
        },
        error: (error) => {
          console.error('Failed to update room status:', error);
          this.toastService.error(
            'Failed to update room status',
            'Update Failed'
          );
        },
      });
  }

  bulkChangeStatus(newStatus: RoomStatus): void {
    if (this.selectedRooms.length === 0) {
      this.toastService.warning(
        'Please select at least one room',
        'No Rooms Selected'
      );
      return;
    }

    const roomCount = this.selectedRooms.length;
    const message = `Are you sure you want to change ${roomCount} room(s) to ${this.getStatusLabel(
      newStatus
    )}?`;

    if (confirm(message)) {
      this.roomService
        .bulkUpdateStatus(this.selectedRooms, newStatus)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Update local data
            this.selectedRooms.forEach((roomId) => {
              const room = this.rooms.find((r) => r.id === roomId);
              if (room) {
                room.status = newStatus;
              }
            });

            this.selectedRooms = [];
            this.applyFilters();
            this.loadStatistics();

            this.toastService.success(
              `Successfully updated ${roomCount} rooms to ${this.getStatusLabel(
                newStatus
              )}`,
              'Bulk Update Completed'
            );
          },
          error: (error) => {
            console.error('Failed to bulk update:', error);
            this.toastService.error(
              'Failed to update room statuses',
              'Bulk Update Failed'
            );
          },
        });
    }
  }

  // Utility Methods
  getStatusLabel(status: string): string {
    const statusFilter = this.statusFilters.find((s) => s.value === status);
    return statusFilter ? statusFilter.label : status;
  }

  getStatusClass(status: string): string {
    const statusFilter = this.statusFilters.find((s) => s.value === status);
    return statusFilter ? statusFilter.class : 'secondary';
  }

  getRoomTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      STANDARD: 'Standard',
      DELUXE: 'Deluxe',
      SUITE: 'Suite',
      PRESIDENTIAL_SUITE: 'Presidential Suite',
      FAMILY_ROOM: 'Family Room',
      STUDIO: 'Studio',
      JUNIOR_SUITE: 'Junior Suite',
      PENTHOUSE: 'Penthouse',
    };
    return types[type] || type;
  }

  trackByRoomId(index: number, room: Room): number {
    return room.id;
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/rooms']);
  }

  viewRoom(roomId: number): void {
    this.router.navigate(['/rooms', roomId]);
  }
}
