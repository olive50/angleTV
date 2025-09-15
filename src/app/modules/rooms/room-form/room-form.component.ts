import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { RoomService } from '../../../core/services/RoomService ';
import { Room, RoomType, RoomStatus, BedType, ViewType } from '../../../core/models/room.model';

@Component({
  selector: 'app-room-form',
  templateUrl: './room-form.component.html',
  styleUrls: ['./room-form.component.css'],
})
export class RoomFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  roomForm: FormGroup;
  isEditMode = false;
  roomId: number | null = null;
  submitting = false;
  loading = false;
  savingDraft = false;

  roomTypes = [
    { value: RoomType.STANDARD, label: 'Standard Room' },
    { value: RoomType.DELUXE, label: 'Deluxe Room' },
    { value: RoomType.SUITE, label: 'Suite' },
    { value: RoomType.PRESIDENTIAL_SUITE, label: 'Presidential Suite' },
    { value: RoomType.FAMILY_ROOM, label: 'Family Room' },
    { value: RoomType.STUDIO, label: 'Studio' },
    { value: RoomType.JUNIOR_SUITE, label: 'Junior Suite' },
    { value: RoomType.PENTHOUSE, label: 'Penthouse' },
  ];

  bedTypes = [
    { value: BedType.SINGLE, label: 'Single Bed' },
    { value: BedType.TWIN, label: 'Twin Beds' },
    { value: BedType.DOUBLE, label: 'Double Bed' },
    { value: BedType.QUEEN, label: 'Queen Bed' },
    { value: BedType.KING, label: 'King Bed' },
    { value: BedType.SOFA_BED, label: 'Sofa Bed' },
    { value: BedType.BUNK_BED, label: 'Bunk Bed' },
  ];

  viewTypes = [
    { value: ViewType.CITY, label: 'City View' },
    { value: ViewType.OCEAN, label: 'Ocean View' },
    { value: ViewType.MOUNTAIN, label: 'Mountain View' },
    { value: ViewType.GARDEN, label: 'Garden View' },
    { value: ViewType.POOL, label: 'Pool View' },
    { value: ViewType.COURTYARD, label: 'Courtyard View' },
    { value: ViewType.INTERIOR, label: 'Interior View' },
  ];

  floors = Array.from({ length: 20 }, (_, i) => i + 1);
  buildings = ['Main Building', 'North Wing', 'South Wing', 'East Tower', 'West Tower'];

  commonAmenities = [
    'Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Telephone',
    'Room Service', 'Laundry Service', 'Iron', 'Hair Dryer', 'Coffee Machine',
    'Refrigerator', 'Microwave', 'Balcony', 'Kitchen', 'Dining Area',
    'Living Room', 'Work Desk', 'Sofa', 'Armchair', 'Wardrobe'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private toastService: ToastService,
    private roomService: RoomService
  ) {
    this.roomForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkEditMode();
    this.setupAutoSave();
    this.loadDraftIfExists();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      roomNumber: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      roomType: [RoomType.STANDARD, [Validators.required]],
      floorNumber: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      building: ['Main Building', [Validators.required]],
      maxOccupancy: [2, [Validators.required, Validators.min(1), Validators.max(10)]],
      pricePerNight: ['', [Validators.required, Validators.min(0)]],
      description: ['', [Validators.maxLength(500)]],
      amenities: [[]],
      hasBalcony: [false],
      hasKitchen: [false],
      accessibility: [false],
      viewType: [ViewType.CITY],
      bedType: [BedType.QUEEN],
      images: [[]],
      status: [RoomStatus.AVAILABLE],
      lastCleaned: [null],
      lastMaintenance: [null]
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
    this.loading = true;
    this.roomService.getRoomById(this.roomId!).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (room) => {
        this.roomForm.patchValue({
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          floorNumber: room.floorNumber,
          building: room.building,
          maxOccupancy: room.capacity,
          pricePerNight: room.pricePerNight,
          description: room.description,
          amenities: room.amenities || [],
          hasBalcony: room.hasBalcony || false,
          hasKitchen: room.hasKitchen || false,
          accessibility: room.accessibility || false,
          viewType: room.viewType || ViewType.CITY,
          bedType: room.bedType || BedType.QUEEN,
          images: room.images || [],
          status: room.status,
          lastCleaned: room.lastCleaned,
          lastMaintenance: room.lastMaintenance
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load room:', error);
        this.toastService.error('Failed to load room data', 'Error');
        this.loading = false;
        // Fallback to mock data for development
        this.loadMockRoomData();
      }
    });
  }

  private loadMockRoomData(): void {
    this.roomForm.patchValue({
      roomNumber: '101',
      roomType: RoomType.STANDARD,
      floorNumber: 1,
      building: 'Main Building',
      maxOccupancy: 2,
      pricePerNight: 89.99,
      description: 'Standard room with city view',
      amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar'],
      hasBalcony: false,
      hasKitchen: false,
      accessibility: false,
      viewType: ViewType.CITY,
      bedType: BedType.QUEEN,
      images: [],
      status: RoomStatus.AVAILABLE,
      lastCleaned: null,
      lastMaintenance: null
    });
  }

  // onSubmit(): void {
  //   if (this.roomForm.invalid || this.submitting) return;

  //   this.submitting = true;
  //   const roomData = this.prepareRoomData();
  //   const action = this.isEditMode ? 'updated' : 'created';
    
  //   const operation = this.isEditMode 
  //     ? this.roomService.updateRoom(this.roomId!, roomData)
  //     : this.roomService.createRoom(roomData);

  //   operation.pipe(takeUntil(this.destroy$)).subscribe({
  //     next: (room) => {
  //       console.log('Room saved:', room);
        
  //       this.notificationService.addNotification({
  //         type: 'success',
  //         title: `Room ${action.charAt(0).toUpperCase() + action.slice(1)}`,
  //         message: `Room ${roomData.roomNumber} has been successfully ${action}`
  //       });
        
  //       this.toastService.success(
  //         `Room ${roomData.roomNumber} has been successfully ${action}`,
  //         `Room ${action.charAt(0).toUpperCase() + action.slice(1)}`
  //       );
        
  //       this.clearDraft();
  //       this.router.navigate(['/rooms']);
  //     },
  //     error: (error) => {
  //       console.error('Failed to save room:', error);
  //       this.notificationService.addNotification({
  //         type: 'error',
  //         title: 'Save Failed',
  //         message: `Failed to ${action.slice(0, -1)} room ${roomData.roomNumber}`
  //       });
        
  //       this.toastService.error(
  //         `Failed to ${action.slice(0, -1)} room ${roomData.roomNumber}`,
  //         'Save Failed'
  //       );
        
  //       this.submitting = false;
  //     }
  //   });
  // }
// ... existing imports and component code

onSubmit(): void {
  if (this.roomForm.invalid || this.submitting) return;

  this.submitting = true;
  const roomData = this.prepareRoomData();
  const action = this.isEditMode ? 'updated' : 'created';
  
  const operation = this.isEditMode 
    ? this.roomService.updateRoom(this.roomId!, roomData)
    : this.roomService.createRoom(roomData);

  operation.pipe(takeUntil(this.destroy$)).subscribe({
    next: (room) => {
      console.log('Room saved:', room);
      
      this.notificationService.addNotification({
        type: 'success',
        title: `Room ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        message: `Room ${roomData.roomNumber} has been successfully ${action}`
      });
      
      this.toastService.success(
        `Room ${roomData.roomNumber} has been successfully ${action}`,
        `Room ${action.charAt(0).toUpperCase() + action.slice(1)}`
      );
      
      this.clearDraft();
      this.router.navigate(['/rooms']);
    },
    error: (error) => {
      console.error('Failed to save room:', error);

      // Extract the specific error message from the API response
      let errorMessage = 'Failed to save room. Please try again.';
      if (error && error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error && error.message) {
        errorMessage = error.message;
      }
      
      this.notificationService.addNotification({
        type: 'error',
        title: 'Save Failed',
        message: errorMessage
      });
      
      this.toastService.error(
        errorMessage,
        'Save Failed'
      );
      
      this.submitting = false;
    }
  });
}


  private prepareRoomData(): Room {
    const formData = this.roomForm.value;
    return {
      id: this.isEditMode ? this.roomId! : 0,
      roomNumber: formData.roomNumber,
      roomType: formData.roomType,
      floorNumber: formData.floorNumber,
      building: formData.building,
      capacity: formData.maxOccupancy,
      pricePerNight: parseFloat(formData.pricePerNight),
      status: formData.status,
      description: formData.description,
      amenities: formData.amenities || [],
      hasBalcony: formData.hasBalcony || false,
      hasKitchen: formData.hasKitchen || false,
      accessibility: formData.accessibility || false,
      viewType: formData.viewType,
      bedType: formData.bedType,
      images: formData.images || [],
      lastCleaned: formData.lastCleaned,
      lastMaintenance: formData.lastMaintenance,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  onCancel(): void {
    if (this.roomForm.dirty) {
      const confirmCancel = confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) {
        return;
      }
      
      this.notificationService.addNotification({
        type: 'info',
        title: 'Form Cancelled',
        message: 'Room form changes were discarded'
      });
      
      this.toastService.info(
        'Room form changes were discarded',
        'Form Cancelled'
      );
    }
    
    this.clearDraft();
    this.router.navigate(['/rooms']);
  }

  // Auto-save and Draft functionality
  private setupAutoSave(): void {
    this.roomForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.roomForm.dirty && !this.submitting) {
        this.saveDraft();
      }
    });
  }

  saveDraft(): void {
    const draftKey = this.getDraftKey();
    const formData = this.roomForm.value;
    localStorage.setItem(draftKey, JSON.stringify({
      data: formData,
      timestamp: new Date().toISOString(),
      isEditMode: this.isEditMode,
      roomId: this.roomId
    }));
  }

  private loadDraftIfExists(): void {
    const draftKey = this.getDraftKey();
    const draft = localStorage.getItem(draftKey);
    
    if (draft && !this.isEditMode) {
      try {
        const draftData = JSON.parse(draft);
        const draftAge = new Date().getTime() - new Date(draftData.timestamp).getTime();
        
        // Only load draft if it's less than 24 hours old
        if (draftAge < 24 * 60 * 60 * 1000) {
          const confirmLoad = confirm('A draft of this form was found. Would you like to restore it?');
          if (confirmLoad) {
            this.roomForm.patchValue(draftData.data);
            this.toastService.info('Draft restored successfully', 'Draft Loaded');
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }

  private clearDraft(): void {
    const draftKey = this.getDraftKey();
    localStorage.removeItem(draftKey);
  }

  private getDraftKey(): string {
    return this.isEditMode 
      ? `room-form-draft-edit-${this.roomId}` 
      : 'room-form-draft-new';
  }

  // Form validation helpers
  getFieldError(fieldName: string): string {
    const field = this.roomForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['pattern']) return `${fieldName} format is invalid`;
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} must be at most ${field.errors['max'].max}`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
    }
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.roomForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Amenities management
  toggleAmenity(amenity: string): void {
    const amenities = this.roomForm.get('amenities')?.value || [];
    const index = amenities.indexOf(amenity);
    
    if (index > -1) {
      amenities.splice(index, 1);
    } else {
      amenities.push(amenity);
    }
    
    this.roomForm.get('amenities')?.setValue([...amenities]);
  }

  isAmenitySelected(amenity: string): boolean {
    const amenities = this.roomForm.get('amenities')?.value || [];
    return amenities.includes(amenity);
  }

  // Image management (placeholder for future implementation)
  onImageUpload(event: any): void {
    // TODO: Implement image upload functionality
    console.log('Image upload not yet implemented');
    this.toastService.info('Image upload feature coming soon', 'Feature Preview');
  }

  removeImage(index: number): void {
    const images = this.roomForm.get('images')?.value || [];
    images.splice(index, 1);
    this.roomForm.get('images')?.setValue([...images]);
  }
}
