// src/app/modules/tv-channels/components/tv-channel-form/tv-channel-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  tap,
} from 'rxjs/operators';
import { TvChannelService } from '../../../../core/services/tv-channel.service';
import { LanguageService } from '../../../../core/services/language.service';
import { TvChannelCategoryService } from '../../../../core/services/tv-channel-category.service';
import {
  TvChannel,
  TvChannelCreateRequest,
  TvChannelUpdateRequest,
} from '../../../../core/models/tv-channel.model';
import { Language } from '../../../../core/models/language.model';
import { TvChannelCategory } from '../../../../core/models/tv-channel-category.model';

@Component({
  selector: 'app-tv-channel-form',
  templateUrl: './tv-channel-form.component.html',
  styleUrls: ['./tv-channel-form.component.css'],
})
export class TvChannelFormComponent implements OnInit, OnDestroy {
  channelForm: FormGroup;
  categories: TvChannelCategory[] = [];
  languages: Language[] = [];

  isEditMode = false;
  channelId: number | null = null;
  loading = false;
  submitting = false;
  testingConnection = false;

  // Form states
  logoPreviewUrl: string | null = null;
  connectionTestResult: { success: boolean; message: string } | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private tvChannelService: TvChannelService,
    private languageService: LanguageService,
    private categoryService: TvChannelCategoryService
  ) {
    this.channelForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadFormData();
    this.setupFormSubscriptions();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      channelNumber: [
        '',
        [Validators.required, Validators.min(1), Validators.max(9999)],
        [this.channelNumberValidator.bind(this)],
      ],
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      description: ['', [Validators.maxLength(500)]],
      ip: ['', [Validators.required, this.ipAddressValidator]],
      port: [
        '',
        [Validators.required, Validators.min(1), Validators.max(65535)],
      ],
      logoUrl: ['', [this.urlValidator]],
      categoryId: ['', [Validators.required]],
      languageId: ['', [Validators.required]],
    });
  }

  private setupFormSubscriptions(): void {
    // Auto-test connection when IP/Port changes
    combineLatest([
      this.channelForm
        .get('ip')!
        .valueChanges.pipe(debounceTime(1000), distinctUntilChanged()),
      this.channelForm
        .get('port')!
        .valueChanges.pipe(debounceTime(1000), distinctUntilChanged()),
    ])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([ip, port]) => {
          if (
            this.channelForm.get('ip')?.valid &&
            this.channelForm.get('port')?.valid
          ) {
            return this.testConnection(false);
          }
          return of(null);
        })
      )
      .subscribe();

    // Preview logo URL
    this.channelForm
      .get('logoUrl')
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((url) => {
        this.updateLogoPreview(url);
      });
  }

  private loadFormData(): void {
    this.loading = true;

    combineLatest([
      this.categoryService.getAllCategories().pipe(
        catchError(() =>
          of([
            { id: 1, name: 'News', description: 'News channels' },
            { id: 2, name: 'Sports', description: 'Sports channels' },
            { id: 3, name: 'Documentary', description: 'Documentary channels' },
            {
              id: 4,
              name: 'Entertainment',
              description: 'Entertainment channels',
            },
          ])
        )
      ),
      this.languageService.getAllLanguages().pipe(
        catchError(() =>
          of([
            { id: 1, name: 'English', code: 'EN' },
            { id: 2, name: 'Arabic', code: 'AR' },
            { id: 3, name: 'French', code: 'FR' },
          ])
        )
      ),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([categories, languages]) => {
          this.categories = categories;
          this.languages = languages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading form data:', error);
          this.loading = false;
        },
      });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.channelId = +id;
      this.loadChannelForEdit();
    }
  }

  private loadChannelForEdit(): void {
    if (!this.channelId) return;

    this.loading = true;
    this.tvChannelService
      .getChannelById(this.channelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (channel) => {
          this.populateForm(channel);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading channel:', error);
          this.loading = false;
          alert('Failed to load channel data. Redirecting to list.');
          this.router.navigate(['/channels']);
        },
      });
  }

  private populateForm(channel: TvChannel): void {
    this.channelForm.patchValue({
      channelNumber: channel.channelNumber,
      name: channel.name,
      description: channel.description || '',
      ip: channel.ip,
      port: channel.port,
      logoUrl: channel.logoUrl || '',
      categoryId: channel.category?.id || '',
      languageId: channel.language?.id || '',
    });

    if (channel.logoUrl) {
      this.logoPreviewUrl = channel.logoUrl;
    }
  }

  private updateLogoPreview(url: string): void {
    if (!url || !this.isValidUrl(url)) {
      this.logoPreviewUrl = null;
      return;
    }

    // Test if image loads
    const img = new Image();
    img.onload = () => {
      this.logoPreviewUrl = url;
    };
    img.onerror = () => {
      this.logoPreviewUrl = null;
    };
    img.src = url;
  }

  private isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  testConnection(
    showLoading = true
  ): Observable<{ success: boolean; message: string } | null> {
    const ip = this.channelForm.get('ip')?.value;
    const port = this.channelForm.get('port')?.value;

    if (
      !ip ||
      !port ||
      this.channelForm.get('ip')?.invalid ||
      this.channelForm.get('port')?.invalid
    ) {
      return of(null);
    }

    if (showLoading) {
      this.testingConnection = true;
    }

    return this.tvChannelService.testChannelConnectivity(ip, port).pipe(
      takeUntil(this.destroy$),
      tap((result) => {
        this.connectionTestResult = result;
        if (showLoading) {
          this.testingConnection = false;
        }
      }),
      catchError((error) => {
        this.connectionTestResult = {
          success: false,
          message: 'Connection test failed',
        };
        if (showLoading) {
          this.testingConnection = false;
        }
        return of(this.connectionTestResult);
      })
    );
  }

  onSubmit(): void {
    if (this.channelForm.invalid || this.submitting) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.channelForm.value;

    const channelData = {
      channelNumber: parseInt(formValue.channelNumber),
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined,
      ip: formValue.ip.trim(),
      port: parseInt(formValue.port),
      logoUrl: formValue.logoUrl?.trim() || undefined,
      categoryId: parseInt(formValue.categoryId),
      languageId: parseInt(formValue.languageId),
    };

    const operation$ = this.isEditMode
      ? this.tvChannelService.updateChannel(this.channelId!, channelData)
      : this.tvChannelService.createChannel(
          channelData as TvChannelCreateRequest
        );

    operation$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (channel) => {
        console.log('Channel saved successfully:', channel);
        this.submitting = false;
        this.router.navigate(['/channels'], {
          queryParams: {
            message: `Channel "${channel.name}" ${
              this.isEditMode ? 'updated' : 'created'
            } successfully`,
          },
        });
      },
      error: (error) => {
        console.error('Error saving channel:', error);
        this.submitting = false;
        alert(
          `Failed to ${this.isEditMode ? 'update' : 'create'} channel: ${
            error.message || 'Unknown error'
          }`
        );
      },
    });
  }

  onCancel(): void {
    if (
      this.channelForm.dirty &&
      !confirm('You have unsaved changes. Are you sure you want to leave?')
    ) {
      return;
    }
    this.router.navigate(['/channels']);
  }

  onTestConnection(): void {
    this.testConnection(true).subscribe();
  }

  onClearLogo(): void {
    this.channelForm.patchValue({ logoUrl: '' });
    this.logoPreviewUrl = null;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.channelForm.controls).forEach((key) => {
      const control = this.channelForm.get(key);
      control?.markAsTouched();
    });
  }

  // Custom Validators
  private ipAddressValidator(
    control: AbstractControl
  ): { [key: string]: any } | null {
    if (!control.value) return null;

    const ipRegex =
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(control.value) ? null : { invalidIp: true };
  }

  private urlValidator(
    control: AbstractControl
  ): { [key: string]: any } | null {
    if (!control.value) return null;

    try {
      new URL(control.value);
      return null;
    } catch {
      return { invalidUrl: true };
    }
  }

  private channelNumberValidator(
    control: AbstractControl
  ): Observable<{ [key: string]: any } | null> {
    if (!control.value) {
      return of(null);
    }

    const channelNumber = parseInt(control.value);
    if (isNaN(channelNumber)) {
      return of({ invalidChannelNumber: true });
    }

    // Skip validation for current channel in edit mode
    if (this.isEditMode && this.channelId) {
      return of(null);
    }

    // In a real implementation, you would check against the backend
    // For now, simulate async validation
    return of(null).pipe(debounceTime(300));
  }

  // Getters for template
  get channelNumber() {
    return this.channelForm.get('channelNumber');
  }
  get name() {
    return this.channelForm.get('name');
  }
  get description() {
    return this.channelForm.get('description');
  }
  get ip() {
    return this.channelForm.get('ip');
  }
  get port() {
    return this.channelForm.get('port');
  }
  get logoUrl() {
    return this.channelForm.get('logoUrl');
  }
  get categoryId() {
    return this.channelForm.get('categoryId');
  }
  get languageId() {
    return this.channelForm.get('languageId');
  }

  // Helper methods for template
  getFieldError(fieldName: string): string {
    const field = this.channelForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    if (errors['required'])
      return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['min'])
      return `${this.getFieldLabel(fieldName)} must be at least ${
        errors['min'].min
      }`;
    if (errors['max'])
      return `${this.getFieldLabel(fieldName)} must not exceed ${
        errors['max'].max
      }`;
    if (errors['minlength'])
      return `${this.getFieldLabel(fieldName)} must be at least ${
        errors['minlength'].requiredLength
      } characters`;
    if (errors['maxlength'])
      return `${this.getFieldLabel(fieldName)} must not exceed ${
        errors['maxlength'].requiredLength
      } characters`;
    if (errors['invalidIp'])
      return 'Please enter a valid IP address (e.g., 192.168.1.100)';
    if (errors['invalidUrl']) return 'Please enter a valid URL';
    if (errors['invalidChannelNumber']) return 'Channel number already exists';

    return 'Invalid value';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      channelNumber: 'Channel Number',
      name: 'Channel Name',
      description: 'Description',
      ip: 'IP Address',
      port: 'Port',
      logoUrl: 'Logo URL',
      categoryId: 'Category',
      languageId: 'Language',
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.channelForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find((c) => c.id === categoryId);
    return category?.name || '';
  }

  getLanguageName(languageId: number): string {
    const language = this.languages.find((l) => l.id === languageId);
    return language ? `${language.name} (${language.code})` : '';
  }
}
