import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-room-detail',
  templateUrl: './room-detail.component.html',
  styleUrls: ['./room-detail.component.css'],
})
export class RoomDetailComponent implements OnInit {
  room: any = null;
  loading = true;

  constructor(private route: ActivatedRoute, private router: Router) {}

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
}
