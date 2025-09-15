// src/app/modules/room/components/room-status-management/room-status.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { 
  Room, 
  RoomStatus, 
  RoomStatistics 
} from 'src/app/core/models/room.model';
import { RoomService } from 'src/app/core/services/RoomService ';
import { NotificationService } from 'src/app/core/services/notification.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';

interface StatusAction {
  status: RoomStatus;
  label: string;
  description: string;
  icon: string;
  color: string;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}

@Component({
  selector: 'app-room-status',
  templateUrl: './room-status.component.html',
  styleUrls: ['./room-status.component.css']
})
export class RoomStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

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

  // Status Actions Configuration
  statusActions: StatusAction[] = [
    {
      status: RoomStatus.AVAILABLE,
      label: 'Set Available',
      description: 'Mark room as ready for new guests',
      icon: 'fas fa-check-circle',
      color: 'success',
      requiresConfirmation: false
    },
    {
      status: RoomStatus.OCCUPIED,
      label: 'Set Occupied',
      description: 'Mark room as currently occupied by guests',
      icon: 'fas fa-user',
      color: 'warning',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to mark this room as occupied?'
    },
    {
      status: RoomStatus.RESERVED,
      label: 'Set Reserved',
      description: 'Mark room as reserved for future check-in',
      icon: 'fas fa-calendar-check',
      color: 'info',
      requiresConfirmation: false
    },
    {
      status: RoomStatus.MAINTENANCE,
      label: 'Set Maintenance',
      description: 'Mark room as under maintenance',
      icon: 'fas fa-tools',
      color: 'danger',
      requiresConfirmation: true,
      confirmationMessage: 'This will make the room unavailable for booking. Continue?'
    },
    {
      status: RoomStatus.OUT_OF_ORDER,
      label: 'Set Out of Order',
      description: 'Mark room as out of order (serious issues)',
      icon: 'fas fa-exclamation-triangle',
      color: 'danger',
      requiresConfirmation: true,
      confirmationMessage: 'This will mark the room as completely unusable. Are you sure?'
    },
    {
      status: RoomStatus.CLEANING,
      label: 'Set Cleaning',
      description: 'Mark room as currently being cleaned',
      icon: 'fas fa-broom',
      color: 'secondary',
      requiresConfirmation: false
    },
    {
      status: RoomStatus.CHECKOUT_PENDING,
      label: 'Set Checkout Pending',
      description: 'Mark room as waiting for guest checkout',
      icon: 'fas fa-sign-out-alt',
      color: 'warning',
      requiresConfirmation: false
    },
    {
      status: RoomStatus.CHECKIN_READY,
      label: 'Set Check-in Ready',
      description: 'Mark room as ready for guest check-in',
      icon: 'fas fa-sign-in-alt',
      color: 'info',
      requiresConfirmation: false
    }
  ];

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
    { value: 'CHECKIN_READY', label: 'Check-in Ready', class: 'info' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roomService: RoomService,
    private notificationService: NotificationService,
    private toastService: ToastService
  ) {
    this.rooms = [];
    this.filteredRooms = [];
  }

  ngOnInit(): void {
    this.loadRooms();
    this.loadStatistics();

    // Check for pre-selected rooms from route params
    this.route.queryParams.subscribe(params => {
      if (params['selectedRooms']) {
        const roomIds = params['selectedRooms'].split(',').map((id: string) => parseInt(id));
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
    this.roomService.getRooms().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.rooms = response;
        } else if (response && response.content && Array.isArray(response.content)) {
          this.rooms = response.content;
        } else {
          this.rooms = [];
        }
        
        this.applyFilters();
        this.loading = false;
        this.error = null;
      },
      error: (error) => {
        console.error('Failed to load rooms:', error);
        this.loading = false;
        this.error = 'Failed to load rooms. Please try again.';
      }
    });
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
      }
    });
  }

  // Filtering
  applyFilters(): void {
    if (!Array.isArray(this.rooms)) {
      this.filteredRooms = [];
      return;
    }

    this.filteredRooms = this.rooms.filter(room => {
      const matchesSearch = !this.searchTerm || 
        room.roomNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        room.building.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.selectedStatus || room.status === this.selectedStatus;
      
      const matchesSelection = !this.showOnlySelected || this.selectedRooms.includes(room.id);

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

  selectAllFiltered(): void {
    this.selectedRooms = [...new Set([...this.selectedRooms, ...this.filteredRooms.map(room => room.id)])];
  }

  deselectAll(): void {
    this.selectedRooms = [];
  }

  // Status Management
  changeRoomStatus(roomId: number, newStatus: RoomStatus): void {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return;

    const statusAction = this.statusActions.find(action => action.status === newStatus);
    
    if (statusAction?.requiresConfirmation) {
      const confirmed = confirm(statusAction.confirmationMessage || 'Are you sure?');
      if (!confirmed) return;
    }

    this.executeStatusChange([roomId], newStatus);
  }

  bulkChangeStatus(newStatus: RoomStatus): void {
    if (this.selectedRooms.length === 0) {
      this.toastService.warning('Please select at least one room', 'No Rooms Selected');
      return;
    }

    const statusAction = this.statusActions.find(action => action.status === newStatus);
    const roomCount = this.selectedRooms.length;
    
    if (statusAction?.requiresConfirmation) {
      const message = `Are you sure you want to change ${roomCount} room(s) to ${statusAction.label}?`;
      const confirmed = confirm(message);
      if (!confirmed) return;
    }

    this.executeStatusChange(this.selectedRooms, newStatus);
  }

  private executeStatusChange(roomIds: number[], newStatus: RoomStatus): void {
    if (roomIds.length === 1) {
      // Single room update
      this.roomService.changeRoomStatus(roomIds[0], newStatus).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (updatedRoom) => {
          const roomIndex = this.rooms.findIndex(r => r.id === roomIds[0]);
          if (roomIndex > -1) {
            this.rooms[roomIndex] = updatedRoom;
          }
          this.applyFilters();
          this.loadStatistics();
          
          const room = this.rooms.find(r => r.id === roomIds[0]);
          this.toastService.success(
            `Room ${room?.roomNumber} status updated to ${this.getStatusLabel(newStatus)}`,
            'Status Updated'
          );
        },
        error: (error) => {
          console.error('Failed to update room status:', error);
          this.toastService.error('Failed to update room status', 'Update Failed');
        }
      });
    } else {
      // Bulk update
      this.roomService.bulkUpdateStatus(roomIds, newStatus).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          // Update local data
          roomIds.forEach(roomId => {
            const room = this.rooms.find(r => r.id === roomId);
            if (room) {
              room.status = newStatus;
            }
          });
          
          this.selectedRooms = [];
          this.applyFilters();
          this.loadStatistics();
          
          this.toastService.success(
            `Successfully updated ${roomIds.length} rooms to ${this.getStatusLabel(newStatus)}`,
            'Bulk Update Completed'
          );
        },
        error: (error) => {
          console.error('Failed to bulk update:', error);
          this.toastService.error('Failed to update room statuses', 'Bulk Update Failed');
        }
      });
    }
  }

  // Utility Methods
  getStatusLabel(status: string): string {
    const statusFilter = this.statusFilters.find(s => s.value === status);
    return statusFilter ? statusFilter.label : status;
  }

  getStatusClass(status: string): string {
    const statusFilter = this.statusFilters.find(s => s.value === status);
    return statusFilter ? statusFilter.class : 'secondary';
  }

  getRoomTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'STANDARD': 'Standard',
      'DELUXE': 'Deluxe',
      'SUITE': 'Suite',
      'PRESIDENTIAL_SUITE': 'Presidential Suite',
      'FAMILY_ROOM': 'Family Room',
      'STUDIO': 'Studio',
      'JUNIOR_SUITE': 'Junior Suite',
      'PENTHOUSE': 'Penthouse'
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