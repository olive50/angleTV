// src/app/modules/guests/components/guest-detail/guest-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-guest-detail',
  templateUrl: './guest-detail.component.html',
  styleUrls: ['./guest-detail.component.css'],
})
export class GuestDetailComponent implements OnInit {
  guest: any = null;
  loading = true;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadGuest(+id);
    }
  }

  loadGuest(id: number): void {
    setTimeout(() => {
      this.guest = {
        id: id,
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
      };
      this.loading = false;
    }, 500);
  }

  editGuest(): void {
    this.router.navigate(['/guests', this.guest.id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/guests']);
  }

  // Add this method to guest-detail.component.ts:
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      CONFIRMED: 'warning',
      CHECKED_IN: 'success',
      CHECKED_OUT: 'secondary',
    };
    return statusMap[status] || 'secondary';
  }
}
