// UPDATED tv-channel-form.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  channelForm: FormGroup;
  categories: TvChannelCategory[] = [];
  languages: Language[] = [];

  isEditMode = false;
  channelId: number | null = null;
  loading = false;
  submitting = false;
  testingConnection = false;

  // Logo related properties
  logoUploadMode: 'file' | 'url' = 'url';
  logoFile: File | null = null;
  logoFileError: string | null = null;
  logoPreviewUrl: string | null = null;
  existingLogoUrl: string | null = null;
  existingLogoPath: string | null = null;

  // Form states
  connectionTestResult: { success: boolean; message: string } | null = null;

  private destroy$ = new Subject<void>();
  private currentChannel: TvChannel | null = null;

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
    // Clean up object URLs
    if (this.logoPreviewUrl && this.logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.logoPreviewUrl);
    }
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

    // Preview logo URL when in URL mode
    this.channelForm
      .get('logoUrl')
      ?.valueChanges.pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((url) => {
        if (this.logoUploadMode === 'url') {
          this.updateLogoPreview(url);
        }
      });
  }

  private loadFormData(): void {
    this.loading = true;

    combineLatest([
      this.categoryService.getAllCategories().pipe(
        catchError(() =>
          of([
            { id: 1, name: 'News-MOCK-DATA', description: 'News channels' },
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
      this.languageService.getAdminLanguages().pipe(
        catchError(() =>
          of([
            {
              "id": 1,
              "name": "English",
              "nativeName": "English",
              "iso6391": "en",
              "iso6392": "eng",
              "localeCode": "en-US",
              "charset": "UTF-8",
              "flagUrl": "https://flags.example.com/us.svg",
              "flagPath": "/assets/flags/us.svg",
              "flagSource": "https://flags.example.com/us.svg",
              "isRtl": false,
              "isActive": true,
              "isDefault": true,
              "isAdminEnabled": true,
              "isGuestEnabled": true,
              "displayOrder": 1,
              "fontFamily": "Arial, sans-serif",
              "currencyCode": "USD",
              "currencySymbol": "$",
              "dateFormat": "MM/dd/yyyy",
              "timeFormat": "hh:mm a",
              "numberFormat": "#,##0.00",
              "decimalSeparator": ".",
              "thousandsSeparator": ",",
              "uiTranslationProgress": 100,
              "channelTranslationProgress": 95,
              "epgTranslationEnabled": true,
              "welcomeMessage": "Welcome to our hotel entertainment system!",
              "supportedPlatforms": [
                  "WEBOS",
                  "WEB",
                  "ANDROID",
                  "IOS",
                  "TIZEN"
              ],
              "overallTranslationProgress": 97,
              "isFullyTranslated": false,
              "isReadyForDisplay": true,
              "isAvailableForAdmin": true,
              "isAvailableForGuests": true,
              "createdAt": "2025-09-07T10:59:53",
              "updatedAt": "2025-09-07T10:59:53",
              "createdBy": "system",
              "lastModifiedBy": "system"
          },
          {
              "id": 2,
              "name": "Arabic",
              "nativeName": "العربية",
              "iso6391": "ar",
              "iso6392": "ara",
              "localeCode": "ar-SA",
              "charset": "UTF-8",
              "flagUrl": "https://flags.example.com/sa.svg",
              "flagPath": "/assets/flags/sa.svg",
              "flagSource": "https://flags.example.com/sa.svg",
              "isRtl": true,
              "isActive": true,
              "isDefault": false,
              "isAdminEnabled": true,
              "isGuestEnabled": true,
              "displayOrder": 2,
              "fontFamily": "Arial, Noto Sans Arabic",
              "currencyCode": "SAR",
              "currencySymbol": "ر.س",
              "dateFormat": "yyyy/MM/dd",
              "timeFormat": "HH:mm",
              "numberFormat": "#,##0.00",
              "decimalSeparator": ".",
              "thousandsSeparator": ",",
              "uiTranslationProgress": 98,
              "channelTranslationProgress": 90,
              "epgTranslationEnabled": true,
              "welcomeMessage": "مرحباً بكم في نظام الترفيه بالفندق!",
              "supportedPlatforms": [
                  "WEBOS",
                  "WEB",
                  "ANDROID",
                  "IOS",
                  "TIZEN"
              ],
              "overallTranslationProgress": 94,
              "isFullyTranslated": false,
              "isReadyForDisplay": true,
              "isAvailableForAdmin": true,
              "isAvailableForGuests": true,
              "createdAt": "2025-09-07T10:59:53",
              "updatedAt": "2025-09-07T10:59:53",
              "createdBy": "system",
              "lastModifiedBy": "system"
          },
          {
              "id": 3,
              "name": "French",
              "nativeName": "Français",
              "iso6391": "fr",
              "iso6392": "fra",
              "localeCode": "fr-FR",
              "charset": "UTF-8",
              "flagUrl": "https://flags.example.com/fr.svg",
              "flagPath": "/assets/flags/fr.svg",
              "flagSource": "https://flags.example.com/fr.svg",
              "isRtl": false,
              "isActive": true,
              "isDefault": false,
              "isAdminEnabled": true,
              "isGuestEnabled": true,
              "displayOrder": 3,
              "fontFamily": "Arial, sans-serif",
              "currencyCode": "EUR",
              "currencySymbol": "€",
              "dateFormat": "dd/MM/yyyy",
              "timeFormat": "HH:mm",
              "numberFormat": "# ##0,00",
              "decimalSeparator": ",",
              "thousandsSeparator": " ",
              "uiTranslationProgress": 100,
              "channelTranslationProgress": 88,
              "epgTranslationEnabled": true,
              "welcomeMessage": "Bienvenue dans notre système de divertissement hôtelier!",
              "supportedPlatforms": [
                  "WEBOS",
                  "WEB",
                  "ANDROID",
                  "IOS",
                  "TIZEN"
              ],
              "overallTranslationProgress": 94,
              "isFullyTranslated": false,
              "isReadyForDisplay": true,
              "isAvailableForAdmin": true,
              "isAvailableForGuests": true,
              "createdAt": "2025-09-07T10:59:53",
              "updatedAt": "2025-09-07T10:59:53",
              "createdBy": "system",
              "lastModifiedBy": "system"
          },
          {
              "id": 4,
              "name": "Spanish",
              "nativeName": "Español",
              "iso6391": "es",
              "iso6392": "spa",
              "localeCode": "es-ES",
              "charset": "UTF-8",
              "flagUrl": "https://flags.example.com/es.svg",
              "flagPath": "/assets/flags/es.svg",
              "flagSource": "https://flags.example.com/es.svg",
              "isRtl": false,
              "isActive": true,
              "isDefault": false,
              "isAdminEnabled": true,
              "isGuestEnabled": true,
              "displayOrder": 4,
              "fontFamily": "Arial, sans-serif",
              "currencyCode": "EUR",
              "currencySymbol": "€",
              "dateFormat": "dd/MM/yyyy",
              "timeFormat": "HH:mm",
              "numberFormat": "#,##0.00",
              "decimalSeparator": ",",
              "thousandsSeparator": ".",
              "uiTranslationProgress": 95,
              "channelTranslationProgress": 85,
              "epgTranslationEnabled": true,
              "welcomeMessage": "¡Bienvenido a nuestro sistema de entretenimiento hotelero!",
              "supportedPlatforms": [
                  "WEBOS",
                  "WEB",
                  "ANDROID",
                  "IOS",
                  "TIZEN"
              ],
              "overallTranslationProgress": 90,
              "isFullyTranslated": false,
              "isReadyForDisplay": true,
              "isAvailableForAdmin": true,
              "isAvailableForGuests": true,
              "createdAt": "2025-09-07T10:59:53",
              "updatedAt": "2025-09-07T10:59:53",
              "createdBy": "system",
              "lastModifiedBy": "system"
          },
          {
              "id": 5,
              "name": "German",
              "nativeName": "Deutsch",
              "iso6391": "de",
              "iso6392": "deu",
              "localeCode": "de-DE",
              "charset": "UTF-8",
              "flagUrl": "https://flags.example.com/de.svg",
              "flagPath": "/assets/flags/de.svg",
              "flagSource": "https://flags.example.com/de.svg",
              "isRtl": false,
              "isActive": true,
              "isDefault": false,
              "isAdminEnabled": true,
              "isGuestEnabled": true,
              "displayOrder": 5,
              "fontFamily": "Arial, sans-serif",
              "currencyCode": "EUR",
              "currencySymbol": "€",
              "dateFormat": "dd.MM.yyyy",
              "timeFormat": "HH:mm",
              "numberFormat": "#.##0,00",
              "decimalSeparator": ",",
              "thousandsSeparator": ".",
              "uiTranslationProgress": 92,
              "channelTranslationProgress": 80,
              "epgTranslationEnabled": true,
              "welcomeMessage": "Willkommen in unserem Hotel-Unterhaltungssystem!",
              "supportedPlatforms": [
                  "WEBOS",
                  "WEB",
                  "ANDROID",
                  "IOS",
                  "TIZEN"
              ],
              "overallTranslationProgress": 86,
              "isFullyTranslated": false,
              "isReadyForDisplay": true,
              "isAvailableForAdmin": true,
              "isAvailableForGuests": true,
              "createdAt": "2025-09-07T10:59:53",
              "updatedAt": "2025-09-07T10:59:53",
              "createdBy": "system",
              "lastModifiedBy": "system"
          },
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
          this.currentChannel = channel;
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

    // Handle existing logo
    if (channel.logoPath) {
      this.existingLogoPath = channel.logoPath;
      this.existingLogoUrl = this.tvChannelService.getLogoUrl(this.channelId!);
      this.logoPreviewUrl = this.existingLogoUrl;
    } else if (channel.logoUrl) {
      this.logoUploadMode = 'url';
      this.logoPreviewUrl = channel.logoUrl;
    }
  }

  setLogoUploadMode(mode: 'file' | 'url'): void {
    this.logoUploadMode = mode;
    this.logoFileError = null;

    if (mode === 'file') {
      // Clear URL when switching to file mode
      this.channelForm.patchValue({ logoUrl: '' });
      // If there's a file, show its preview
      if (this.logoFile) {
        this.createFilePreview(this.logoFile);
      } else if (!this.existingLogoUrl) {
        this.logoPreviewUrl = null;
      }
    } else {
      // Clear file when switching to URL mode
      this.clearLogoFile();
      // Update preview based on URL field
      const url = this.channelForm.get('logoUrl')?.value;
      if (url) {
        this.updateLogoPreview(url);
      } else if (!this.existingLogoUrl) {
        this.logoPreviewUrl = null;
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!validTypes.includes(file.type)) {
        this.logoFileError =
          'Please select a valid image file (JPG, PNG, GIF, or WebP)';
        this.logoFile = null;
        this.logoPreviewUrl = this.existingLogoUrl;
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        this.logoFileError = 'File size must be less than 5MB';
        this.logoFile = null;
        this.logoPreviewUrl = this.existingLogoUrl;
        return;
      }

      this.logoFileError = null;
      this.logoFile = file;
      this.createFilePreview(file);
    }
  }

  private createFilePreview(file: File): void {
    // Clean up previous object URL if it exists
    if (this.logoPreviewUrl && this.logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.logoPreviewUrl);
    }

    // Create new preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  clearLogoFile(): void {
    this.logoFile = null;
    this.logoFileError = null;

    // Reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    // Reset preview to existing logo or null
    this.logoPreviewUrl = this.existingLogoUrl;
  }

  onClearLogo(): void {
    this.channelForm.patchValue({ logoUrl: '' });
    if (this.logoUploadMode === 'url') {
      this.logoPreviewUrl = this.existingLogoUrl;
    }
  }

  onLogoPreviewError(): void {
    this.logoPreviewUrl = null;
  }

  private updateLogoPreview(url: string): void {
    if (!url || !this.isValidUrl(url)) {
      this.logoPreviewUrl = this.existingLogoUrl;
      return;
    }

    // Test if image loads
    const img = new Image();
    img.onload = () => {
      this.logoPreviewUrl = url;
    };
    img.onerror = () => {
      this.logoPreviewUrl = this.existingLogoUrl;
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
    if (this.channelForm.invalid || this.submitting || this.logoFileError) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.channelForm.value;

    const channelData: TvChannelCreateRequest | TvChannelUpdateRequest = {
      channelNumber: parseInt(formValue.channelNumber),
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined,
      ip: formValue.ip.trim(),
      port: parseInt(formValue.port),
      logoUrl:
        this.logoUploadMode === 'url' && formValue.logoUrl?.trim()
          ? formValue.logoUrl.trim()
          : undefined,
      categoryId: parseInt(formValue.categoryId),
      languageId: parseInt(formValue.languageId),
    };

    let operation$: Observable<TvChannel>;

    // Determine which endpoint to use based on whether we have a logo file
    if (this.isEditMode && this.channelId) {
      // UPDATE
      if (
        this.logoFile ||
        (this.logoUploadMode === 'file' && this.existingLogoPath)
      ) {
        // Use update with logo endpoint (supports both file upload and keeping existing)
        operation$ = this.tvChannelService.updateChannelWithLogo(
          this.channelId,
          channelData,
          this.logoFile || undefined
        );
      } else {
        // Use regular update endpoint (for URL or no logo)
        operation$ = this.tvChannelService.updateChannel(
          this.channelId,
          channelData
        );
      }
    } else {
      // CREATE
      if (this.logoFile) {
        // Use create with logo endpoint
        operation$ = this.tvChannelService.createChannelWithLogo(
          channelData as TvChannelCreateRequest,
          this.logoFile
        );
      } else {
        // Use regular create endpoint
        operation$ = this.tvChannelService.createChannel(
          channelData as TvChannelCreateRequest
        );
      }
    }

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
        const errorMessage =
          error.error?.message || error.message || 'Unknown error';
        alert(
          `Failed to ${
            this.isEditMode ? 'update' : 'create'
          } channel: ${errorMessage}`
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
    return language ? `${language.name} (${language.iso6392})` : '';
  }
}
