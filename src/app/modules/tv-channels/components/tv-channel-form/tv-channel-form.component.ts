// UPDATED tv-channel-form.component.ts with duplication support
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
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmService } from '../../../../shared/components/confirm/confirm.service';

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
  isDuplicateMode = false;
  channelId: number | null = null;
  sourceChannelId: number | null = null;
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
    private categoryService: TvChannelCategoryService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {
    this.channelForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadFormData();
    this.setupFormSubscriptions();
    this.handleRouteParameters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Clean up object URLs
    if (this.logoPreviewUrl && this.logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.logoPreviewUrl);
    }
  }

  private handleRouteParameters(): void {
    // Handle both route params (for edit mode) and query params (for duplication)
    combineLatest([this.route.paramMap, this.route.queryParams])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, queryParams]) => {
        console.log('Route params:', params);
        console.log('Query params:', queryParams);

        const id = params.get('id');

        if (id) {
          // Edit mode
          console.log('Edit mode detected, channel ID:', id);
          this.isEditMode = true;
          this.isDuplicateMode = false;
          this.channelId = +id;
          this.loadChannelForEdit();
        } else if (queryParams['duplicate'] === 'true') {
          // Duplicate mode - check for both sourceId and data parameters
          if (queryParams['sourceId']) {
            // Method 1: Using sourceId (load from backend)
            console.log(
              'Duplicate mode detected, source ID:',
              queryParams['sourceId']
            );
            this.isDuplicateMode = true;
            this.isEditMode = false;
            this.sourceChannelId = +queryParams['sourceId'];
            this.loadChannelForDuplication();
          } else if (queryParams['data']) {
            // Method 2: Using direct data (parse from URL)
            console.log('Duplicate mode detected with direct data');
            try {
              const channelData = JSON.parse(
                decodeURIComponent(queryParams['data'])
              );
              console.log('Parsed channel data:', channelData);
              this.isDuplicateMode = true;
              this.isEditMode = false;
              this.populateFormForDuplication(channelData);
            } catch (error) {
              console.error('Error parsing channel data from URL:', error);
              this.toast.error('Invalid channel data for duplication');
              this.router.navigate(['/channels']);
            }
          }
        } else {
          console.log('Add new channel mode');
          this.isEditMode = false;
          this.isDuplicateMode = false;
        }
      });
  }

  private loadChannelForDuplication(): void {
    if (!this.sourceChannelId) {
      console.error('No source channel ID provided for duplication');
      return;
    }

    console.log(
      'Loading channel for duplication, source ID:',
      this.sourceChannelId
    );
    this.loading = true;

    this.tvChannelService
      .getChannelForDuplication(this.sourceChannelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (channel) => {
          console.log('Received channel for duplication:', channel);
          this.populateFormForDuplication(channel);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading channel for duplication:', error);
          this.toast.error('Failed to load channel for duplication');
          this.loading = false;
          this.router.navigate(['/channels']);
        },
      });
  }

  private populateFormForDuplication(channel: TvChannel): void {
    console.log('Populating form with duplicated channel data:', channel);

    // Modify the channel data for duplication
    const modifiedChannel = {
      ...channel,
      channelNumber: this.suggestNewChannelNumber(channel.channelNumber),
      name: channel.name.includes('(Copy)')
        ? channel.name
        : `${channel.name} (Copy)`,
      port: (channel.port || 8000) + 1,
    };

    console.log('Modified channel data:', modifiedChannel);

    this.channelForm.patchValue({
      channelNumber: modifiedChannel.channelNumber,
      name: modifiedChannel.name,
      description: modifiedChannel.description || '',
      ip: modifiedChannel.ip,
      port: modifiedChannel.port,
      logoUrl: modifiedChannel.logoUrl || '',
      streamUrl: modifiedChannel.streamUrl || '',
      categoryId: modifiedChannel.category?.id || '',
      languageId: modifiedChannel.language?.id || '',
    });

    console.log('Form values after patching:', this.channelForm.value);

    // Clear logo file since this is a new channel
    this.logoFile = null;
    this.existingLogoUrl = null;
    this.existingLogoPath = null;

    // If the original had a logo URL, keep it in URL mode
    if (modifiedChannel.logoUrl) {
      this.logoUploadMode = 'url';
      this.updateLogoPreview(modifiedChannel.logoUrl);
    } else {
      this.logoPreviewUrl = null;
    }

    this.toast.info(
      `Duplicating "${channel.name}". Please review and modify the details before saving.`
    );
  }

  private suggestNewChannelNumber(originalNumber: number): number {
    // Simple logic for suggesting new channel number
    let newNumber = originalNumber + 1;

    // If too close to original, add 100 to create more separation
    if (newNumber - originalNumber < 10) {
      newNumber = originalNumber + 100;
    }

    // Ensure it's within valid range
    if (newNumber > 9999) {
      newNumber = originalNumber + 1;
    }

    return newNumber;
  }

  private async getNextAvailableChannelNumber(
    baseNumber: number
  ): Promise<number> {
    // Simple logic - in a real app you might want to check with backend
    let nextNumber = baseNumber + 1;

    // If too close to original, add 100
    if (nextNumber - baseNumber < 10) {
      nextNumber = baseNumber + 100;
    }

    return nextNumber;
  }

  // Getters for template
  get pageTitle(): string {
    if (this.isDuplicateMode) {
      return 'Duplicate Channel';
    } else if (this.isEditMode) {
      return 'Edit Channel';
    } else {
      return 'Add New Channel';
    }
  }

  get submitButtonText(): string {
    if (this.submitting) {
      if (this.isDuplicateMode) {
        return 'Duplicating...';
      } else if (this.isEditMode) {
        return 'Updating...';
      } else {
        return 'Creating...';
      }
    } else {
      if (this.isDuplicateMode) {
        return 'Duplicate Channel';
      } else if (this.isEditMode) {
        return 'Update Channel';
      } else {
        return 'Create Channel';
      }
    }
  }

  get pageIcon(): string {
    if (this.isDuplicateMode) {
      return 'fa-copy';
    } else if (this.isEditMode) {
      return 'fa-edit';
    } else {
      return 'fa-plus';
    }
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      channelNumber: [
        '',
        [Validators.required, Validators.min(1), Validators.max(9999)],
        [this.channelNumberValidator.bind(this)],
      ],
      sortOrder: [
        '',
        [Validators.required, Validators.min(1), Validators.max(9999)],
        [this.sortOrderValidator.bind(this)],
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
      streamUrl: ['', [Validators.required]],
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
            { id: 1, name: 'News', description: 'News channels' },
            { id: 2, name: 'Sports', description: 'Sports channels' },
            { id: 3, name: 'Documentary', description: 'Documentary channels' },
          ])
        )
      ),
      this.languageService.getAdminLanguagesSimple().pipe(
        // ✅ Utilisez la méthode Simple
        catchError(() =>
          of([
            {
              id: 1,
              name: 'English',
              nativeName: 'English',
              iso6391: 'en',
              iso6392: 'eng',
              isAdminEnabled: true,
              isGuestEnabled: true,
            },
          ])
        )
      ),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([categories, languages]) => {
          this.categories = categories;
          this.languages = languages; // ✅ Maintenant c'est un tableau direct
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading form data:', error);
          this.loading = false;
          this.toast.warning('Some form data could not be loaded');
        },
      });
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
          this.toast.error('Failed to load channel. Redirecting to list.');
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
      streamUrl: channel.streamUrl || '',
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

  onSubmit(): void {
    if (this.channelForm.invalid || this.submitting || this.logoFileError) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.channelForm.value;

    let channelData: TvChannelCreateRequest | TvChannelUpdateRequest;

    if (this.isEditMode && this.currentChannel) {
      // ✅ EDIT MODE: Only include changed fields
      channelData = this.getChangedFields(formValue, this.currentChannel);
    } else {
      // ✅ CREATE/DUPLICATE MODE: Include all fields
      channelData = {
        channelNumber: parseInt(formValue.channelNumber),
        sortOrder: parseInt(formValue.sortOrder),
        name: formValue.name.trim(),
        description: formValue.description?.trim() || undefined,
        ip: formValue.ip.trim(),
        port: parseInt(formValue.port),
        streamUrl: formValue.streamUrl.trim(),
        logoUrl:
          this.logoUploadMode === 'url' && formValue.logoUrl?.trim()
            ? formValue.logoUrl.trim()
            : undefined,
        categoryId: parseInt(formValue.categoryId),
        languageId: parseInt(formValue.languageId),
      };
    }

    // Rest of your existing submit logic remains the same...
    let operation$: Observable<TvChannel>;

    if (this.isEditMode && this.channelId) {
      // UPDATE mode
      if (
        this.logoFile ||
        (this.logoUploadMode === 'file' && this.existingLogoPath)
      ) {
        operation$ = this.tvChannelService.updateChannelWithLogo(
          this.channelId,
          channelData,
          this.logoFile || undefined
        );
      } else {
        operation$ = this.tvChannelService.updateChannel(
          this.channelId,
          channelData
        );
      }
    } else {
      // CREATE mode (both new and duplicate)
      if (this.logoFile) {
        operation$ = this.tvChannelService.createChannelWithLogo(
          channelData as TvChannelCreateRequest,
          this.logoFile
        );
      } else {
        operation$ = this.tvChannelService.createChannel(
          channelData as TvChannelCreateRequest
        );
      }
    }

    // Continue with your existing subscription logic...
    operation$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (channel) => {
        console.log('Channel saved successfully:', channel);
        this.submitting = false;

        let successMessage: string;
        if (this.isDuplicateMode) {
          successMessage = `Channel "${channel.name}" duplicated successfully!`;
        } else if (this.isEditMode) {
          successMessage = `Channel "${channel.name}" updated successfully!`;
        } else {
          successMessage = `Channel "${channel.name}" created successfully!`;
        }

        this.toast.success(successMessage);
        this.router.navigate(['/channels'], {
          queryParams: { message: successMessage },
        });
      },
      error: (error) => {
        console.error('Error saving channel:', error);
        this.submitting = false;
        const errorMessage =
          error.error?.message || error.message || 'Unknown error';

        let actionText: string;
        if (this.isDuplicateMode) {
          actionText = 'duplicate';
        } else if (this.isEditMode) {
          actionText = 'update';
        } else {
          actionText = 'create';
        }

        this.toast.error(`Failed to ${actionText} channel: ${errorMessage}`);
      },
    });
  }
  async onCancel(): Promise<void> {
    if (this.channelForm.dirty) {
      const ok = await this.confirm.open(
        'Discard changes',
        'You have unsaved changes. Are you sure you want to leave?',
        'Leave',
        'Stay'
      );
      if (!ok) return;
    }

    // Navigate back to channels list
    this.router.navigate(['/channels']);
  }

  // Rest of your existing methods remain the same...
  setLogoUploadMode(mode: 'file' | 'url'): void {
    this.logoUploadMode = mode;
    this.logoFileError = null;

    if (mode === 'file') {
      this.channelForm.patchValue({ logoUrl: '' });
      if (this.logoFile) {
        this.createFilePreview(this.logoFile);
      } else if (!this.existingLogoUrl) {
        this.logoPreviewUrl = null;
      }
    } else {
      this.clearLogoFile();
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

      const maxSize = 5 * 1024 * 1024; // 5MB
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
    if (this.logoPreviewUrl && this.logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.logoPreviewUrl);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  clearLogoFile(): void {
    this.logoFile = null;
    this.logoFileError = null;

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

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
        this.toast.info(result.message);
      }),
      catchError((error) => {
        this.connectionTestResult = {
          success: false,
          message: 'Connection test failed',
        };
        if (showLoading) {
          this.testingConnection = false;
        }
        this.toast.error('Connection test failed');
        return of(this.connectionTestResult);
      })
    );
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

    // Skip validation for current channel in edit mode (but not duplicate mode)
    if (this.isEditMode && this.channelId && !this.isDuplicateMode) {
      return of(null);
    }

    return of(null).pipe(debounceTime(300));
  }
  private sortOrderValidator(
    control: AbstractControl
  ): Observable<{ [key: string]: any } | null> {
    if (!control.value) {
      return of(null);
    }

    const channelNumber = parseInt(control.value);
    if (isNaN(channelNumber)) {
      return of({ invalidChannelNumber: true });
    }

    // Skip validation for current channel in edit mode (but not duplicate mode)
    if (this.isEditMode && this.channelId && !this.isDuplicateMode) {
      return of(null);
    }

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

  private getChangedFields(
    formValue: any,
    originalChannel: TvChannel
  ): Partial<TvChannelUpdateRequest> {
    const changes: Partial<TvChannelUpdateRequest> = {};

    console.log('🔍 Detecting changes...');
    console.log('Form values:', formValue);
    console.log('Original channel:', originalChannel);

    // Check each field for changes
    const newChannelNumber = parseInt(formValue.channelNumber);
    if (newChannelNumber !== originalChannel.channelNumber) {
      changes.channelNumber = newChannelNumber;
      console.log(
        '✏️ Channel number changed:',
        originalChannel.channelNumber,
        '->',
        newChannelNumber
      );
    }

    const newName = formValue.name?.trim();
    if (newName && newName !== originalChannel.name) {
      changes.name = newName;
      console.log('✏️ Name changed:', originalChannel.name, '->', newName);
    }

    const newDescription = formValue.description?.trim();
    if (newDescription !== (originalChannel.description || '')) {
      changes.description = newDescription || undefined;
      console.log(
        '✏️ Description changed:',
        originalChannel.description,
        '->',
        newDescription
      );
    }

    const newIp = formValue.ip?.trim();
    if (newIp && newIp !== originalChannel.ip) {
      changes.ip = newIp;
      console.log('✏️ IP changed:', originalChannel.ip, '->', newIp);
    }

    const newPort = parseInt(formValue.port);
    if (newPort && newPort !== originalChannel.port) {
      changes.port = newPort;
      console.log('✏️ Port changed:', originalChannel.port, '->', newPort);
    }

    const newStreamUrl = formValue.streamUrl?.trim();
    if (newStreamUrl && newStreamUrl !== (originalChannel.streamUrl || '')) {
      changes.streamUrl = newStreamUrl;
      console.log(
        '✏️ Stream URL changed:',
        originalChannel.streamUrl,
        '->',
        newStreamUrl
      );
    }

    // Handle logo URL (only if in URL mode)
    if (this.logoUploadMode === 'url') {
      const newLogoUrl = formValue.logoUrl?.trim();
      if (newLogoUrl !== (originalChannel.logoUrl || '')) {
        changes.logoUrl = newLogoUrl || undefined;
        console.log(
          '✏️ Logo URL changed:',
          originalChannel.logoUrl,
          '->',
          newLogoUrl
        );
      }
    }

    // ✅ CRITICAL: Only include category/language if they actually changed
    const newCategoryId = parseInt(formValue.categoryId);
    if (newCategoryId && newCategoryId !== originalChannel.category?.id) {
      changes.categoryId = newCategoryId;
      console.log(
        '✏️ Category changed:',
        originalChannel.category?.id,
        '->',
        newCategoryId
      );
    }

    const newLanguageId = parseInt(formValue.languageId);
    if (newLanguageId && newLanguageId !== originalChannel.language?.id) {
      changes.languageId = newLanguageId;
      console.log(
        '✏️ Language changed:',
        originalChannel.language?.id,
        '->',
        newLanguageId
      );
    }

    console.log('📤 Final changes to send:', changes);
    return changes;
  }
}
