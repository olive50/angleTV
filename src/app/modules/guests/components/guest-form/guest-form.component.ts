import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';
import {
  LoyaltyLevel,
  Gender,
  Guest,
  GuestCreateDto,
  GuestUpdateDto,
} from 'src/app/core/models/guest.model';
import { GuestService } from 'src/app/core/services/guest.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';

@Component({
  selector: 'app-guest-form',
  templateUrl: './guest-form.component.html',
  styleUrls: ['./guest-form.component.css'],
})
export class GuestFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  guestForm: FormGroup;
  isEditMode = false;
  guestId: number | null = null;
  submitting = false;
  loading = false;

  // Options for dropdowns
  loyaltyLevels = [
    { value: LoyaltyLevel.BRONZE, label: 'Bronze' },
    { value: LoyaltyLevel.SILVER, label: 'Silver' },
    { value: LoyaltyLevel.GOLD, label: 'Gold' },
    { value: LoyaltyLevel.PLATINUM, label: 'Platinum' },
    { value: LoyaltyLevel.DIAMOND, label: 'Diamond' },
  ];

  genderOptions = [
    { value: Gender.MALE, label: 'Male' },
    { value: Gender.FEMALE, label: 'Female' },
    { value: Gender.OTHER, label: 'Other' },
  ];

  // Available languages and rooms (these would typically come from your backend)
  languages: any[] = [];
  rooms: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private guestService: GuestService,
    private toastService: ToastService,
    private notificationService: NotificationService
  ) {
    this.guestForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkEditMode();
    this.loadFormData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      pmsGuestId: [''], // Optional, will be auto-generated if not provided
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      phone: ['', [Validators.pattern(/^[+]?[0-9\s\-()]{10,20}$/)]],
      nationality: ['', [Validators.maxLength(50)]],
      dateOfBirth: [''],
      gender: [''],
      vipStatus: [false],
      loyaltyLevel: [LoyaltyLevel.BRONZE],
      languageId: [''],
      roomId: [''],
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.guestId = +id;
      this.loadGuestData();
    }
  }

  loadFormData(): void {
    // In a real application, you would load languages and rooms from your backend
    // For now, we'll leave these empty or add sample data
    this.languages = [
      { id: 1, name: 'English', code: 'en' },
      { id: 2, name: 'French', code: 'fr' },
      { id: 3, name: 'Arabic', code: 'ar' },
    ];

    this.rooms = [
      { id: 1, roomNumber: '101', roomType: 'STANDARD' },
      { id: 2, roomNumber: '102', roomType: 'DELUXE' },
      { id: 3, roomNumber: '201', roomType: 'SUITE' },
    ];
  }

  loadGuestData(): void {
    if (!this.guestId) return;

    this.loading = true;
    this.guestService
      .getGuestById(this.guestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guest: Guest) => {
          this.populateForm(guest);
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading guest:', error);
          this.toastService.error('Failed to load guest data', 'Load Error');
          this.loading = false;
          this.router.navigate(['/guests']);
        },
      });
  }

  populateForm(guest: Guest): void {
    this.guestForm.patchValue({
      pmsGuestId: guest.pmsGuestId,
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email || '',
      phone: guest.phone || '',
      nationality: guest.nationality || '',
      dateOfBirth: guest.dateOfBirth
        ? this.formatDateForInput(guest.dateOfBirth)
        : '',
      gender: guest.gender || '',
      vipStatus: guest.vipStatus,
      loyaltyLevel: guest.loyaltyLevel,
      languageId: guest.language?.id || '',
      roomId: guest.room?.id || '',
    });
  }

  formatDateForInput(dateString: string): string {
    // Convert backend date format to HTML date input format (YYYY-MM-DD)
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.guestForm.invalid || this.submitting) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;

    if (this.isEditMode) {
      this.updateGuest();
    } else {
      this.createGuest();
    }
  }

  createGuest(): void {
    const formData = this.guestForm.value;
    const guestDto: GuestCreateDto = this.mapFormToCreateDto(formData);

    this.guestService
      .createGuest(guestDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guest: Guest) => {
          this.submitting = false;
          this.toastService.success(
            `Guest ${guest.firstName} ${guest.lastName} has been created successfully`,
            'Guest Created'
          );

          this.notificationService.addNotification({
            type: 'success',
            title: 'New Guest Added',
            message: `${guest.firstName} ${guest.lastName} has been registered in the system`,
          });

          this.router.navigate(['/guests']);
        },
        error: (error: any) => {
          console.error('Error creating guest:', error);
          this.submitting = false;
          this.toastService.error('Failed to create guest', 'Creation Error');

          // Handle specific validation errors from backend
          if (error.message && error.message.includes('already exists')) {
            this.toastService.warning(
              'A guest with this information already exists',
              'Duplicate Guest'
            );
          }
        },
      });
  }

  updateGuest(): void {
    if (!this.guestId) return;

    const formData = this.guestForm.value;
    const guestDto: GuestUpdateDto = this.mapFormToUpdateDto(formData);

    this.guestService
      .updateGuest(this.guestId, guestDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guest: Guest) => {
          this.submitting = false;
          this.toastService.success(
            `Guest ${guest.firstName} ${guest.lastName} has been updated successfully`,
            'Guest Updated'
          );

          this.notificationService.addNotification({
            type: 'info',
            title: 'Guest Updated',
            message: `${guest.firstName} ${guest.lastName} information has been modified`,
          });

          this.router.navigate(['/guests']);
        },
        error: (error: any) => {
          console.error('Error updating guest:', error);
          this.submitting = false;
          this.toastService.error('Failed to update guest', 'Update Error');
        },
      });
  }

  mapFormToCreateDto(formData: any): GuestCreateDto {
    return {
      pmsGuestId: formData.pmsGuestId || undefined,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      nationality: formData.nationality || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      gender: formData.gender || undefined,
      vipStatus: formData.vipStatus || false,
      loyaltyLevel: formData.loyaltyLevel,
      languageId: formData.languageId ? Number(formData.languageId) : undefined,
      roomId: formData.roomId ? Number(formData.roomId) : undefined,
    };
  }

  mapFormToUpdateDto(formData: any): GuestUpdateDto {
    return {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      nationality: formData.nationality || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      gender: formData.gender || undefined,
      vipStatus: formData.vipStatus || false,
      loyaltyLevel: formData.loyaltyLevel,
      languageId: formData.languageId ? Number(formData.languageId) : undefined,
      roomId: formData.roomId ? Number(formData.roomId) : undefined,
    };
  }

  markFormGroupTouched(): void {
    Object.keys(this.guestForm.controls).forEach((key) => {
      const control = this.guestForm.get(key);
      control?.markAsTouched();
    });
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.guestForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.guestForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['pattern']) return `${fieldName} format is invalid`;
    }
    return '';
  }

  onCancel(): void {
    if (this.guestForm.dirty) {
      if (
        confirm('You have unsaved changes. Are you sure you want to leave?')
      ) {
        this.router.navigate(['/guests']);
      }
    } else {
      this.router.navigate(['/guests']);
    }
  }

  // Utility methods for template
  get pageTitle(): string {
    if (this.loading) return 'Loading...';
    return this.isEditMode ? 'Edit Guest' : 'Add New Guest';
  }

  get pageSubtitle(): string {
    if (this.loading) return 'Please wait...';
    return this.isEditMode ? 'Update guest information' : 'Enter guest details';
  }

  get submitButtonText(): string {
    if (this.submitting) return 'Saving...';
    return this.isEditMode ? 'Update Guest' : 'Create Guest';
  }
}
