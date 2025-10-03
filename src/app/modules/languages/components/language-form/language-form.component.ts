import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Language } from 'src/app/core/models/language.model';
import { LanguageService } from 'src/app/core/services/language.service';

@Component({
  selector: 'app-language-form',
  templateUrl: './language-form.component.html',
  styleUrls: ['./language-form.component.css'],
})
export class LanguageFormComponent implements OnInit, OnDestroy {
  languageForm: FormGroup;
  isEditMode = false;
  languageId: number | null = null;
  submitting = false;
  loading = false;
  error: string | null = null;

  // File upload
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private languageService: LanguageService
  ) {
    this.languageForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkEditMode();

    // Subscribe to loading state
    this.languageService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => (this.loading = loading));

    // Subscribe to error state
    this.languageService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => (this.error = error));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      nativeName: ['', [Validators.required, Validators.minLength(2)]],
      iso6391: ['', [Validators.required, Validators.pattern(/^[a-z]{2}$/)]],
      iso6392: ['', [Validators.pattern(/^[a-z]{3}$/)]],
      localeCode: [''],
      charset: ['UTF-8', [Validators.required]],
      currencyCode: [''],
      currencySymbol: [''],
      isAdminEnabled: [true],
      isGuestEnabled: [true],
      isRtl: [false],
      displayOrder: [0, [Validators.min(0)]],
      fontFamily: [''],
      dateFormat: [''],
      timeFormat: [''],
      numberFormat: [''],
      decimalSeparator: ['.'],
      thousandsSeparator: [','],
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.languageId = +id;
      this.loadLanguageForEdit();
    }
  }

  loadLanguageForEdit(): void {
    if (this.languageId === null) return;

    this.languageService
      .getLanguageById(this.languageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (language: Language) => {
          this.languageForm.patchValue({
            name: language.name,
            nativeName: language.nativeName,
            iso6391: language.iso6391,
            iso6392: language.iso6392,
            localeCode: language.localeCode,
            charset: language.charset || 'UTF-8',
            currencyCode: language.currencyCode,
            currencySymbol: language.currencySymbol,
            isAdminEnabled: language.isAdminEnabled,
            isGuestEnabled: language.isGuestEnabled,
            isRtl: language.isRtl,
            displayOrder: language.displayOrder || 0,
            fontFamily: language.fontFamily,
            dateFormat: language.dateFormat,
            timeFormat: language.timeFormat,
            numberFormat: language.numberFormat,
            decimalSeparator: language.decimalSeparator || '.',
            thousandsSeparator: language.thousandsSeparator || ',',
          });

          // Set preview for existing flag
          if (language.flagPath) {
            this.previewUrl = `http://localhost:8080${language.flagPath}`;
          }
        },
        error: (error) => {
          console.error('Error loading language:', error);
          this.error = 'Failed to load language details';
        },
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onSubmit(): void {
    if (this.languageForm.invalid || this.submitting) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.languageForm.controls).forEach((key) => {
        this.languageForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.error = null;

    const formData = this.languageForm.value;

    if (this.isEditMode && this.languageId !== null) {
      // Update existing language
      if (this.selectedFile) {
        // Update with flag
        this.languageService
          .updateLanguageWithFlag(this.languageId, formData, this.selectedFile)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              console.log('Language updated successfully with flag');
              this.router.navigate(['/languages']);
            },
            error: (error) => {
              console.error('Error updating language:', error);
              this.error = error.message;
              this.submitting = false;
            },
          });
      } else {
        // Update without flag
        this.languageService
          .updateLanguage(this.languageId, formData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              console.log('Language updated successfully');
              this.router.navigate(['/languages']);
            },
            error: (error) => {
              console.error('Error updating language:', error);
              this.error = error.message;
              this.submitting = false;
            },
          });
      }
    } else {
      // Create new language
      if (this.selectedFile) {
        // Create with flag
        this.languageService
          .createLanguageWithFlag(formData, this.selectedFile)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              console.log('Language created successfully with flag');
              this.router.navigate(['/languages']);
            },
            error: (error) => {
              console.error('Error creating language:', error);
              this.error = error.message;
              this.submitting = false;
            },
          });
      } else {
        // Create without flag
        this.languageService
          .createLanguage(formData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              console.log('Language created successfully');
              this.router.navigate(['/languages']);
            },
            error: (error) => {
              console.error('Error creating language:', error);
              this.error = error.message;
              this.submitting = false;
            },
          });
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/languages']);
  }

  // Helper methods for form validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.languageForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.languageForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field?.hasError('minlength')) {
      return `${fieldName} must be at least ${field.errors?.['minlength'].requiredLength} characters`;
    }
    if (field?.hasError('pattern')) {
      return `${fieldName} format is invalid`;
    }
    if (field?.hasError('min')) {
      return `${fieldName} must be at least ${field.errors?.['min'].min}`;
    }
    return '';
  }
}
