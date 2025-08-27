import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.css'],
})
export class GeneralSettingsComponent implements OnInit {
  generalForm: FormGroup;
  submitting = false;

  constructor(private formBuilder: FormBuilder) {
    this.generalForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      hotelName: ['Hotel New Day', [Validators.required]],
      hotelAddress: ['123 Hotel Street, Algiers', [Validators.required]],
      hotelPhone: ['+213 21 123 456', [Validators.required]],
      hotelEmail: [
        'info@hotelnewday.com',
        [Validators.required, Validators.email],
      ],
      timezone: ['Africa/Algiers', [Validators.required]],
      currency: ['DZD', [Validators.required]],
      language: ['en', [Validators.required]],
      dateFormat: ['DD/MM/YYYY', [Validators.required]],
      timeFormat: ['24h', [Validators.required]],
    });
  }

  loadSettings(): void {
    // Settings are already set in createForm with default values
    console.log('Settings loaded');
  }

  onSubmit(): void {
    if (this.generalForm.invalid || this.submitting) return;

    this.submitting = true;
    setTimeout(() => {
      console.log('Settings saved:', this.generalForm.value);
      this.submitting = false;
      alert('Settings saved successfully!');
    }, 1000);
  }
}
