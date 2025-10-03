import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { TerminalService } from 'src/app/core/services/Terminal.service';
import {
  Terminal,
  TerminalCreateRequest,
  TerminalUpdateRequest,
  DeviceType,
} from 'src/app/core/models/terminal.model';

@Component({
  selector: 'app-terminal-form',
  templateUrl: './terminal-form.component.html',
  styleUrls: ['./terminal-form.component.css'],
})
export class TerminalFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  terminalForm: FormGroup;
  isEditMode = false;
  terminalId: number | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;

  deviceTypes = [
    { value: DeviceType.SET_TOP_BOX, label: 'Set Top Box' },
    { value: DeviceType.SMART_TV, label: 'Smart TV' },
    { value: DeviceType.DESKTOP_PC, label: 'Desktop PC' },
    { value: DeviceType.TABLET, label: 'Tablet' },
    { value: DeviceType.MOBILE, label: 'Mobile' },
    { value: DeviceType.DISPLAY_SCREEN, label: 'Display Screen' },
  ];

  availableRooms: { id: number; roomNumber: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private terminalService: TerminalService,
    private toast: ToastService
  ) {
    this.terminalForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkEditMode();
    this.loadRooms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      terminalCode: ['', [Validators.required, Validators.maxLength(50)]],
      deviceType: [DeviceType.SET_TOP_BOX, [Validators.required]],
      brand: ['', [Validators.required, Validators.maxLength(50)]],
      model: ['', [Validators.required, Validators.maxLength(50)]],
      macAddress: [
        '',
        [
          Validators.required,
          Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/),
        ],
      ],
      ipAddress: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
          ),
        ],
      ],
      location: ['', [Validators.required, Validators.maxLength(100)]],
      roomId: [null],
      serialNumber: ['', Validators.maxLength(50)],
      firmwareVersion: ['', Validators.maxLength(20)],
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'add') {
      this.isEditMode = true;
      this.terminalId = +id;
      this.loadTerminal();
    }
  }

  private loadTerminal(): void {
    if (!this.terminalId) return;

    this.loading = true;
    this.error = null;

    this.terminalService
      .getTerminalById(this.terminalId)
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (terminal) => {
          this.terminalForm.patchValue({
            terminalCode: terminal.terminalCode,
            deviceType: terminal.deviceType,
            brand: terminal.brand,
            model: terminal.model,
            macAddress: terminal.macAddress,
            ipAddress: terminal.ipAddress,
            location: terminal.location,
            roomId: terminal.room?.id || null,
            serialNumber: terminal.serialNumber || '',
            firmwareVersion: terminal.firmwareVersion || '',
          });
        },
        error: (error) => {
          this.error = error.message;
          this.toast.error('Failed to load terminal: ' + error.message);
        },
      });
  }

  private loadRooms(): void {
    // In a real app, load from room service
    this.availableRooms = [
      { id: 1, roomNumber: '101' },
      { id: 2, roomNumber: '102' },
      { id: 3, roomNumber: '201' },
      { id: 4, roomNumber: '202' },
    ];
  }

  onSubmit(): void {
    if (this.terminalForm.invalid || this.submitting) return;

    this.submitting = true;
    this.error = null;

    const formValue = this.terminalForm.value;

    if (this.isEditMode) {
      this.updateTerminal(formValue);
    } else {
      this.createTerminal(formValue);
    }
  }

  private createTerminal(formValue: any): void {
    const request: TerminalCreateRequest = {
      terminalCode: formValue.terminalCode,
      deviceType: formValue.deviceType,
      brand: formValue.brand,
      model: formValue.model,
      macAddress: formValue.macAddress.toUpperCase(),
      ipAddress: formValue.ipAddress,
      location: formValue.location,
      roomId: formValue.roomId || undefined,
      serialNumber: formValue.serialNumber || undefined,
      firmwareVersion: formValue.firmwareVersion || undefined,
    };

    this.terminalService
      .createTerminal(request)
      .pipe(
        finalize(() => (this.submitting = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (terminal) => {
          this.toast.success(
            `Terminal "${terminal.terminalCode}" created successfully`
          );
          this.router.navigate(['/terminals']);
        },
        error: (error) => {
          this.error = error.message;
          this.toast.error('Failed to create terminal: ' + error.message);
        },
      });
  }

  private updateTerminal(formValue: any): void {
    if (!this.terminalId) return;

    const request: TerminalUpdateRequest = {
      terminalCode: formValue.terminalCode,
      deviceType: formValue.deviceType,
      brand: formValue.brand,
      model: formValue.model,
      macAddress: formValue.macAddress.toUpperCase(),
      ipAddress: formValue.ipAddress,
      location: formValue.location,
      roomId: formValue.roomId || undefined,
      serialNumber: formValue.serialNumber || undefined,
      firmwareVersion: formValue.firmwareVersion || undefined,
    };

    this.terminalService
      .updateTerminal(this.terminalId, request)
      .pipe(
        finalize(() => (this.submitting = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (terminal) => {
          this.toast.success(
            `Terminal "${terminal.terminalCode}" updated successfully`
          );
          this.router.navigate(['/terminals']);
        },
        error: (error) => {
          this.error = error.message;
          this.toast.error('Failed to update terminal: ' + error.message);
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/terminals']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.terminalForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.terminalForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['maxlength']) return `${fieldName} is too long`;
    if (field.errors['pattern']) {
      if (fieldName === 'macAddress')
        return 'Invalid MAC address format (XX:XX:XX:XX:XX:XX)';
      if (fieldName === 'ipAddress') return 'Invalid IP address format';
    }
    return 'Invalid input';
  }
}
