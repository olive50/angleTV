import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-language-form',
  templateUrl: './language-form.component.html',
  styleUrls: ['./language-form.component.css'],
})
export class LanguageFormComponent implements OnInit {
  languageForm: FormGroup;
  isEditMode = false;
  languageId: number | null = null;
  submitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.languageForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkEditMode();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],
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
    // Mock data
    this.languageForm.patchValue({
      name: 'Arabic',
      code: 'AR',
    });
  }

  onSubmit(): void {
    if (this.languageForm.invalid || this.submitting) return;

    this.submitting = true;
    setTimeout(() => {
      console.log('Language saved:', this.languageForm.value);
      this.router.navigate(['/languages']);
    }, 1000);
  }

  onCancel(): void {
    this.router.navigate(['/languages']);
  }
}
