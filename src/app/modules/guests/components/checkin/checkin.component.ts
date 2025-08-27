// src/app/modules/guests/components/checkin/checkin.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkin',
  templateUrl: './checkin.component.html',
  styleUrls: ['./checkin.component.css'],
})
export class CheckinComponent implements OnInit {
  checkinForm: FormGroup;
  submitting = false;
  availableRooms: any[] = [];

  constructor(private formBuilder: FormBuilder, private router: Router) {
    this.checkinForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAvailableRooms();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      guestId: ['', [Validators.required]],
      roomId: ['', [Validators.required]],
      checkInDate: [
        new Date().toISOString().split('T')[0],
        [Validators.required],
      ],
      checkOutDate: ['', [Validators.required]],
      specialRequests: [''],
    });
  }

  loadAvailableRooms(): void {
    this.availableRooms = [
      { id: 1, roomNumber: '101', type: 'Standard' },
      { id: 2, roomNumber: '102', type: 'Standard' },
      { id: 3, roomNumber: '201', type: 'Deluxe' },
    ];
  }

  onSubmit(): void {
    if (this.checkinForm.invalid || this.submitting) return;

    this.submitting = true;
    setTimeout(() => {
      console.log('Check-in completed:', this.checkinForm.value);
      this.router.navigate(['/guests']);
    }, 1000);
  }

  onCancel(): void {
    this.router.navigate(['/guests']);
  }
}
