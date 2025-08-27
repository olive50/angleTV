import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tv-channel-form',
  templateUrl: './tv-channel-form.component.html',
  styleUrls: ['./tv-channel-form.component.css'],
})
export class TvChannelFormComponent implements OnInit {
  channelForm: FormGroup;
  categories: any[] = [];
  languages: any[] = [];
  isEditMode = false;
  channelId: number | null = null;
  loading = false;
  submitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
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
    this.categories = [
      { id: 1, name: 'News' },
      { id: 2, name: 'Sports' },
      { id: 3, name: 'Entertainment' },
    ];
  }

  loadLanguages(): void {
    this.languages = [
      { id: 1, name: 'English', code: 'EN' },
      { id: 2, name: 'Arabic', code: 'AR' },
      { id: 3, name: 'French', code: 'FR' },
    ];
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
    if (this.channelId) {
      this.channelForm.patchValue({
        channelNumber: 101,
        name: 'CNN International',
        description: 'International news channel',
        ip: '192.168.1.100',
        port: 8001,
        logoUrl: 'https://example.com/cnn-logo.png',
        categoryId: 1,
        languageId: 1,
      });
    }
  }

  onSubmit(): void {
    if (this.channelForm.invalid || this.submitting) return;

    this.submitting = true;
    setTimeout(() => {
      console.log('Channel saved:', this.channelForm.value);
      this.router.navigate(['/channels']);
    }, 1000);
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
