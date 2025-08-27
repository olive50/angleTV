import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-room-form',
  templateUrl: './room-form.component.html',
  styleUrls: ['./room-form.component.css'],
})
export class RoomFormComponent implements OnInit {
  roomForm: FormGroup;
  isEditMode = false;
  roomId: number | null = null;
  submitting = false;

  roomTypes = [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'DELUXE', label: 'Deluxe' },
    { value: 'SUITE', label: 'Suite' },
    { value: 'PRESIDENTIAL_SUITE', label: 'Presidential Suite' },
    { value: 'FAMILY_ROOM', label: 'Family Room' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.roomForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkEditMode();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      roomNumber: ['', [Validators.required]],
      roomType: ['STANDARD', [Validators.required]],
      floorNumber: ['', [Validators.required, Validators.min(1)]],
      building: ['Main Building', [Validators.required]],
      maxOccupancy: ['', [Validators.required, Validators.min(1)]],
      pricePerNight: ['', [Validators.required, Validators.min(0)]],
      description: [''],
      amenities: [[]],
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.roomId = +id;
      this.loadRoomForEdit();
    }
  }

  loadRoomForEdit(): void {
    // Mock data
    this.roomForm.patchValue({
      roomNumber: '101',
      roomType: 'STANDARD',
      floorNumber: 1,
      building: 'Main Building',
      maxOccupancy: 2,
      pricePerNight: 89.99,
      description: 'Standard room with city view',
      amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar'],
    });
  }

  onSubmit(): void {
    if (this.roomForm.invalid || this.submitting) return;

    this.submitting = true;
    setTimeout(() => {
      console.log('Room saved:', this.roomForm.value);
      this.router.navigate(['/rooms']);
    }, 1000);
  }

  onCancel(): void {
    this.router.navigate(['/rooms']);
  }
}
