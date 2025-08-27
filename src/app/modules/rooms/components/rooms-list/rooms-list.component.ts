import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export interface Room {
  id: number;
  roomNumber: string;
  roomType:
    | 'STANDARD'
    | 'DELUXE'
    | 'SUITE'
    | 'PRESIDENTIAL_SUITE'
    | 'FAMILY_ROOM';
  floorNumber: number;
  building: string;
  maxOccupancy: number;
  pricePerNight: number;
  status:
    | 'AVAILABLE'
    | 'OCCUPIED'
    | 'MAINTENANCE'
    | 'OUT_OF_ORDER'
    | 'CLEANING';
  description: string;
  amenities: string[];
  currentGuest?: { name: string; checkOut: Date };
}

@Component({
  selector: 'app-rooms-list',
  templateUrl: './rooms-list.component.html',
  styleUrls: ['./rooms-list.component.css'],
})
export class RoomsListComponent implements OnInit {
  rooms: Room[] = [
    {
      id: 1,
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
    },
    {
      id: 2,
      roomNumber: '102',
      roomType: 'STANDARD',
      floorNumber: 1,
      building: 'Main Building',
      maxOccupancy: 2,
      pricePerNight: 89.99,
      status: 'AVAILABLE',
      description: 'Standard room with garden view',
      amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar'],
    },
    {
      id: 3,
      roomNumber: '201',
      roomType: 'DELUXE',
      floorNumber: 2,
      building: 'Main Building',
      maxOccupancy: 3,
      pricePerNight: 129.99,
      status: 'OCCUPIED',
      description: 'Deluxe room with balcony',
      amenities: [
        'Wi-Fi',
        'Smart TV',
        'Air Conditioning',
        'Mini Bar',
        'Balcony',
      ],
      currentGuest: {
        name: 'Fatima Zohra',
        checkOut: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
    },
    {
      id: 4,
      roomNumber: '301',
      roomType: 'SUITE',
      floorNumber: 3,
      building: 'Main Building',
      maxOccupancy: 4,
      pricePerNight: 199.99,
      status: 'CLEANING',
      description: 'Executive suite with living room',
      amenities: [
        'Wi-Fi',
        'Smart TV',
        'Air Conditioning',
        'Mini Bar',
        'Living Room',
        'Kitchen',
      ],
    },
  ];

  filteredRooms = [...this.rooms];
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';
  floorFilter = '';

  roomTypes = [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'DELUXE', label: 'Deluxe' },
    { value: 'SUITE', label: 'Suite' },
    { value: 'PRESIDENTIAL_SUITE', label: 'Presidential Suite' },
    { value: 'FAMILY_ROOM', label: 'Family Room' },
  ];

  statuses = [
    { value: 'AVAILABLE', label: 'Available', class: 'success' },
    { value: 'OCCUPIED', label: 'Occupied', class: 'warning' },
    { value: 'MAINTENANCE', label: 'Maintenance', class: 'danger' },
    { value: 'OUT_OF_ORDER', label: 'Out of Order', class: 'danger' },
    { value: 'CLEANING', label: 'Cleaning', class: 'info' },
  ];

  floors = [1, 2, 3, 4, 5];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredRooms = this.rooms.filter((room) => {
      const matchesSearch =
        !this.searchTerm ||
        room.roomNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        room.description.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus =
        !this.statusFilter || room.status === this.statusFilter;
      const matchesType = !this.typeFilter || room.roomType === this.typeFilter;
      const matchesFloor =
        !this.floorFilter || room.floorNumber.toString() === this.floorFilter;

      return matchesSearch && matchesStatus && matchesType && matchesFloor;
    });
  }

  getStatusClass(status: string): string {
    const statusObj = this.statuses.find((s) => s.value === status);
    return statusObj ? statusObj.class : 'secondary';
  }

  getRoomTypeLabel(type: string): string {
    const typeObj = this.roomTypes.find((t) => t.value === type);
    return typeObj ? typeObj.label : type;
  }

  viewRoom(id: number): void {
    this.router.navigate(['/rooms', id]);
  }

  editRoom(id: number): void {
    this.router.navigate(['/rooms', id, 'edit']);
  }

  changeRoomStatus(id: number, newStatus: string): void {
    const room = this.rooms.find((r) => r.id === id);
    if (room) {
      room.status = newStatus as any;
      this.applyFilters();
    }
  }

  addRoom(): void {
    this.router.navigate(['/rooms/add']);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.floorFilter = '';
    this.applyFilters();
  }
}
