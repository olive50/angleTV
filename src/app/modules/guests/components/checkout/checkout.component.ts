import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  submitting = false;
  occupiedRooms: any[] = [];

  constructor(private formBuilder: FormBuilder, private router: Router) {
    this.checkoutForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadOccupiedRooms();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      guestId: ['', [Validators.required]],
      roomId: ['', [Validators.required]],
      checkOutDate: [
        new Date().toISOString().split('T')[0],
        [Validators.required],
      ],
      finalBill: [0, [Validators.required, Validators.min(0)]],
      paymentStatus: ['PAID', [Validators.required]],
      notes: [''],
    });
  }

  loadOccupiedRooms(): void {
    this.occupiedRooms = [
      { id: 1, roomNumber: '101', guest: 'Ahmed Ben Ali' },
      { id: 3, roomNumber: '201', guest: 'Fatima Zohra' },
    ];
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid || this.submitting) return;

    this.submitting = true;
    setTimeout(() => {
      console.log('Check-out completed:', this.checkoutForm.value);
      this.router.navigate(['/guests']);
    }, 1000);
  }

  onCancel(): void {
    this.router.navigate(['/guests']);
  }
}
