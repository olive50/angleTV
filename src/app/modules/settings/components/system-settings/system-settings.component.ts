import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-system-settings',
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.css'],
})
export class SystemSettingsComponent implements OnInit {
  systemForm: FormGroup;
  submitting = false;

  constructor(private formBuilder: FormBuilder) {
    this.systemForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      backupEnabled: [true],
      backupFrequency: ['daily', [Validators.required]],
      backupRetention: [30, [Validators.required, Validators.min(1)]],
      maintenanceMode: [false],
      debugLogging: [false],
      sessionTimeout: [60, [Validators.required, Validators.min(5)]],
      maxLoginAttempts: [5, [Validators.required, Validators.min(3)]],
      passwordExpiry: [90, [Validators.required, Validators.min(30)]],
      autoLogout: [true],
      emailNotifications: [true],
      smsNotifications: [false],
    });
  }

  loadSettings(): void {
    console.log('System settings loaded');
  }

  onSubmit(): void {
    if (this.systemForm.invalid || this.submitting) return;

    this.submitting = true;
    setTimeout(() => {
      console.log('System settings saved:', this.systemForm.value);
      this.submitting = false;
      alert('System settings saved successfully!');
    }, 1000);
  }

  toggleMaintenanceMode(): void {
    const maintenanceMode = this.systemForm.get('maintenanceMode')?.value;
    if (maintenanceMode) {
      if (
        confirm(
          'Are you sure you want to enable maintenance mode? This will restrict system access.'
        )
      ) {
        console.log('Maintenance mode enabled');
      } else {
        this.systemForm.patchValue({ maintenanceMode: false });
      }
    }
  }
}
