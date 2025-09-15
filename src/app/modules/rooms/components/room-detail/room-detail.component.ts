import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-room-detail',
  templateUrl: './room-detail.component.html',
  styleUrls: ['./room-detail.component.css'],
})
export class RoomDetailComponent implements OnInit {
  room: any = null;
  loading = true;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private notificationService: NotificationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRoom(+id);
    }
  }

  loadRoom(id: number): void {
    setTimeout(() => {
      this.room = {
        id: id,
        roomNumber: '101',
        roomType: 'STANDARD',
        floorNumber: 1,
        building: 'Main Building',
        maxOccupancy: 2,
        pricePerNight: 89.99,
        status: 'OCCUPIED',
        description: 'Standard room with city view',
        amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar'],
        currentGuest: {
          name: 'Ahmed Ben Ali',
          checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      };
      this.loading = false;
      
      this.notificationService.addNotification({
        type: 'info',
        title: 'Room Details Loaded',
        message: `Room ${this.room.roomNumber} details loaded successfully`
      });
      
      this.toastService.info(
        `Room ${this.room.roomNumber} details loaded successfully`,
        'Room Details Loaded'
      );
    }, 500);
  }

  editRoom(): void {
    this.router.navigate(['/rooms', this.room.id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/rooms']);
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      AVAILABLE: 'success',
      OCCUPIED: 'warning',
      MAINTENANCE: 'danger',
      OUT_OF_ORDER: 'danger',
      CLEANING: 'info',
    };
    return statusMap[status] || 'secondary';
  }

  getRoomTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      STANDARD: 'Standard',
      DELUXE: 'Deluxe',
      SUITE: 'Suite',
      PRESIDENTIAL_SUITE: 'Presidential Suite',
      FAMILY_ROOM: 'Family Room',
    };
    return typeMap[type] || type;
  }

  // Room Status Management
  changeRoomStatus(newStatus: string): void {
    const oldStatus = this.room.status;
    this.room.status = newStatus;
    
    this.notificationService.addNotification({
      type: 'success',
      title: 'Status Updated',
      message: `Room ${this.room.roomNumber} status changed from ${this.getStatusLabel(oldStatus)} to ${this.getStatusLabel(newStatus)}`
    });
    
    this.toastService.success(
      `Room ${this.room.roomNumber} status changed from ${this.getStatusLabel(oldStatus)} to ${this.getStatusLabel(newStatus)}`,
      'Status Updated'
    );
  }

  checkInRoom(): void {
    this.changeRoomStatus('OCCUPIED');
    this.toastService.info(
      `Room ${this.room.roomNumber} is now occupied`,
      'Check-in Completed'
    );
  }

  checkOutRoom(): void {
    this.changeRoomStatus('CLEANING');
    this.toastService.info(
      `Room ${this.room.roomNumber} is now being cleaned`,
      'Check-out Completed'
    );
  }

  markForMaintenance(): void {
    this.changeRoomStatus('MAINTENANCE');
    this.toastService.warning(
      `Room ${this.room.roomNumber} has been marked for maintenance`,
      'Maintenance Scheduled'
    );
  }

  markAsAvailable(): void {
    this.changeRoomStatus('AVAILABLE');
    this.toastService.success(
      `Room ${this.room.roomNumber} is now available for booking`,
      'Room Available'
    );
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      AVAILABLE: 'Available',
      OCCUPIED: 'Occupied',
      MAINTENANCE: 'Maintenance',
      OUT_OF_ORDER: 'Out of Order',
      CLEANING: 'Cleaning',
      RESERVED: 'Reserved',
      CHECKOUT_PENDING: 'Checkout Pending',
      CHECKIN_READY: 'Check-in Ready'
    };
    return statusMap[status] || status;
  }
}
