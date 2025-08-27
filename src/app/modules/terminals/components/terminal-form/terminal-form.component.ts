import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-terminal-form',
  templateUrl: './terminal-form.component.html',
  styleUrls: ['./terminal-form.component.css'],
})
export class TerminalFormComponent implements OnInit {
  terminalForm: FormGroup;
  isEditMode = false;
  terminalId: number | null = null;
  submitting = false;

  deviceTypes = [
    { value: 'SET_TOP_BOX', label: 'Set Top Box' },
    { value: 'SMART_TV', label: 'Smart TV' },
    { value: 'DESKTOP_PC', label: 'Desktop PC' },
    { value: 'TABLET', label: 'Tablet' },
    { value: 'MOBILE', label: 'Mobile' },
    { value: 'DISPLAY_SCREEN', label: 'Display Screen' },
  ];

  availableRooms = [
    { id: 1, roomNumber: '101' },
    { id: 2, roomNumber: '102' },
    { id: 3, roomNumber: '201' },
    { id: 4, roomNumber: '202' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.terminalForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkEditMode();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      terminalId: ['', [Validators.required]],
      deviceType: ['SET_TOP_BOX', [Validators.required]],
      brand: ['', [Validators.required]],
      model: ['', [Validators.required]],
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
      location: ['', [Validators.required]],
      roomId: [''],
      serialNumber: [''],
      firmwareVersion: [''],
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.terminalId = +id;
      this.loadTerminalForEdit();
    }
  }

  loadTerminalForEdit(): void {
    // Mock data
    this.terminalForm.patchValue({
      terminalId: 'STB001',
      deviceType: 'SET_TOP_BOX',
      brand: 'Samsung',
      model: 'SMT-C7140',
      macAddress: '00:1A:2B:3C:4D:5E',
      ipAddress: '192.168.1.101',
      location: 'Room 101',
      roomId: 1,
      serialNumber: 'SN001234567',
      firmwareVersion: '2.1.5',
    });
  }

  onSubmit(): void {
    if (this.terminalForm.invalid || this.submitting) return;

    this.submitting = true;
    setTimeout(() => {
      console.log('Terminal saved:', this.terminalForm.value);
      this.router.navigate(['/terminals']);
    }, 1000);
  }

  onCancel(): void {
    this.router.navigate(['/terminals']);
  }
}
