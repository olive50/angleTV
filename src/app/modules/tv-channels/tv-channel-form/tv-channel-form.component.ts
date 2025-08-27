import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TvChannelService } from '../../../core/services/tv-channel.service';
import { TvChannelCategoryService } from '../../../core/services/tv-channel-category.service';
import { LanguageService } from '../../../core/services/language.service';
import {
  TvChannel,
  TvChannelCreateRequest,
  TvChannelUpdateRequest,
} from '../../models/tv-channel.model';
import { TvChannelCategory } from '../../models/tv-channel-category.model';
import { Language } from '../../models/language.model';

@Component({
  selector: 'app-tv-channel-form',
  templateUrl: './tv-channel-form.component.html',
  styleUrls: ['./tv-channel-form.component.css'],
})
export class TvChannelFormComponent implements OnInit {
  channelForm: FormGroup;
  categories: TvChannelCategory[] = [];
  languages: Language[] = [];
  isEditMode = false;
  channelId: number | null = null;
  loading = false;
  submitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private tvChannelService: TvChannelService,
    private categoryService: TvChannelCategoryService,
    private languageService: LanguageService
  ) {
    this.channelForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadLanguages();
    this.checkEditMode();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      channelNumber: ['', [Validators.required, Validators.min(1)]],
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      description: ['', [Validators.maxLength(500)]],
      ip: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
          ),
        ],
      ],
      port: [
        '',
        [Validators.required, Validators.min(1), Validators.max(65535)],
      ],
      logoUrl: [''],
      categoryId: ['', [Validators.required]],
      languageId: ['', [Validators.required]],
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => (this.categories = data),
      error: (error) => console.error('Error loading categories:', error),
    });
  }

  loadLanguages(): void {
    this.languageService.getAllLanguages().subscribe({
      next: (data) => (this.languages = data),
      error: (error) => console.error('Error loading languages:', error),
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.channelId = +id;
      this.loadChannelForEdit();
    }
  }

  loadChannelForEdit(): void {
    if (!this.channelId) return;

    this.loading = true;
    this.tvChannelService.getChannelById(this.channelId).subscribe({
      next: (channel) => {
        this.channelForm.patchValue({
          channelNumber: channel.channelNumber,
          name: channel.name,
          description: channel.description,
          ip: channel.ip,
          port: channel.port,
          logoUrl: channel.logoUrl,
          categoryId: channel.category?.id,
          languageId: channel.language?.id,
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading channel:', error);
        this.loading = false;
        this.router.navigate(['/channels']);
      },
    });
  }

  onSubmit(): void {
    if (this.channelForm.invalid || this.submitting) return;

    this.submitting = true;

    if (this.isEditMode && this.channelId) {
      this.updateChannel();
    } else {
      this.createChannel();
    }
  }

  createChannel(): void {
    const channelData: TvChannelCreateRequest = {
      channelNumber: +this.channelForm.value.channelNumber,
      name: this.channelForm.value.name,
      description: this.channelForm.value.description,
      ip: this.channelForm.value.ip,
      port: +this.channelForm.value.port,
      logoUrl: this.channelForm.value.logoUrl,
      categoryId: +this.channelForm.value.categoryId,
      languageId: +this.channelForm.value.languageId,
    };

    this.tvChannelService.createChannel(channelData).subscribe({
      next: (channel) => {
        console.log('Channel created successfully:', channel);
        this.router.navigate(['/channels']);
      },
      error: (error) => {
        console.error('Error creating channel:', error);
        this.submitting = false;
      },
    });
  }

  updateChannel(): void {
    const channelData: TvChannelUpdateRequest = {
      channelNumber: +this.channelForm.value.channelNumber,
      name: this.channelForm.value.name,
      description: this.channelForm.value.description,
      ip: this.channelForm.value.ip,
      port: +this.channelForm.value.port,
      logoUrl: this.channelForm.value.logoUrl,
      categoryId: +this.channelForm.value.categoryId,
      languageId: +this.channelForm.value.languageId,
    };

    this.tvChannelService
      .updateChannel(this.channelId!, channelData)
      .subscribe({
        next: (channel) => {
          console.log('Channel updated successfully:', channel);
          this.router.navigate(['/channels']);
        },
        error: (error) => {
          console.error('Error updating channel:', error);
          this.submitting = false;
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/channels']);
  }

  // Getters for form validation
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
}
