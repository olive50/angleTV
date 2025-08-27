import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export interface Guest {
  id: number;
  guestId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  vipStatus: boolean;
  loyaltyLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  currentRoom?: { id: number; roomNumber: string };
  checkInDate?: Date;
  checkOutDate?: Date;
  reservationStatus: 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT';
}

@Component({
  selector: 'app-guests-list',
  templateUrl: './guests-list.component.html',
  styleUrls: ['./guests-list.component.css'],
})
export class GuestsListComponent implements OnInit {
  guests: Guest[] = [
    {
      id: 1,
      guestId: 'G12345678',
      firstName: 'Ahmed',
      lastName: 'Ben Ali',
      email: 'ahmed.benali@email.com',
      phone: '+213555123456',
      nationality: 'Algeria',
      vipStatus: false,
      loyaltyLevel: 'BRONZE',
      currentRoom: { id: 1, roomNumber: '101' },
      checkInDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      reservationStatus: 'CHECKED_IN',
    },
    {
      id: 2,
      guestId: 'G87654321',
      firstName: 'Fatima',
      lastName: 'Zohra',
      email: 'fatima.zohra@email.com',
      phone: '+213666789012',
      nationality: 'Algeria',
      vipStatus: true,
      loyaltyLevel: 'GOLD',
      currentRoom: { id: 2, roomNumber: '205' },
      checkInDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      reservationStatus: 'CHECKED_IN',
    },
    {
      id: 3,
      guestId: 'G11223344',
      firstName: 'Mohamed',
      lastName: 'Cherif',
      email: 'mohamed.cherif@email.com',
      phone: '+213777456789',
      nationality: 'Algeria',
      vipStatus: false,
      loyaltyLevel: 'SILVER',
      reservationStatus: 'CONFIRMED',
    },
  ];

  filteredGuests = [...this.guests];
  searchTerm = '';
  statusFilter = '';
  vipFilter = '';
  loyaltyFilter = '';

  loyaltyLevels = [
    { value: 'BRONZE', label: 'Bronze', class: 'bronze' },
    { value: 'SILVER', label: 'Silver', class: 'silver' },
    { value: 'GOLD', label: 'Gold', class: 'gold' },
    { value: 'PLATINUM', label: 'Platinum', class: 'platinum' },
    { value: 'DIAMOND', label: 'Diamond', class: 'diamond' },
  ];

  statuses = [
    { value: 'CONFIRMED', label: 'Confirmed', class: 'warning' },
    { value: 'CHECKED_IN', label: 'Checked In', class: 'success' },
    { value: 'CHECKED_OUT', label: 'Checked Out', class: 'secondary' },
  ];

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
    this.filteredGuests = this.guests.filter((guest) => {
      const matchesSearch =
        !this.searchTerm ||
        guest.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        guest.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        guest.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        guest.guestId.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus =
        !this.statusFilter || guest.reservationStatus === this.statusFilter;
      const matchesVip =
        !this.vipFilter ||
        (this.vipFilter === 'true' && guest.vipStatus) ||
        (this.vipFilter === 'false' && !guest.vipStatus);
      const matchesLoyalty =
        !this.loyaltyFilter || guest.loyaltyLevel === this.loyaltyFilter;

      return matchesSearch && matchesStatus && matchesVip && matchesLoyalty;
    });
  }

  getLoyaltyClass(level: string): string {
    const loyaltyObj = this.loyaltyLevels.find((l) => l.value === level);
    return loyaltyObj ? loyaltyObj.class : 'bronze';
  }

  getStatusClass(status: string): string {
    const statusObj = this.statuses.find((s) => s.value === status);
    return statusObj ? statusObj.class : 'secondary';
  }

  viewGuest(id: number): void {
    this.router.navigate(['/guests', id]);
  }

  editGuest(id: number): void {
    this.router.navigate(['/guests', id, 'edit']);
  }

  checkInGuest(id: number): void {
    // TODO: Implement check-in logic
    const guest = this.guests.find((g) => g.id === id);
    if (guest) {
      guest.reservationStatus = 'CHECKED_IN';
      guest.checkInDate = new Date();
      this.applyFilters();
    }
  }

  checkOutGuest(id: number): void {
    // TODO: Implement check-out logic
    const guest = this.guests.find((g) => g.id === id);
    if (guest) {
      guest.reservationStatus = 'CHECKED_OUT';
      this.applyFilters();
    }
  }

  addGuest(): void {
    this.router.navigate(['/guests/add']);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.vipFilter = '';
    this.loyaltyFilter = '';
    this.applyFilters();
  }
}
