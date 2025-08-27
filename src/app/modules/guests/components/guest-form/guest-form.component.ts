import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-guest-form',
  templateUrl: './guest-form.component.html',
  styleUrls: ['./guest-form.component.css'],
})
export class GuestFormComponent implements OnInit {
  guestForm: FormGroup;
  isEditMode = false;
  guestId: number | null = null;
  submitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.guestForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkEditMode();
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      nationality: ['', [Validators.required]],
      vipStatus: [false],
      loyaltyLevel: ['BRONZE', [Validators.required]],
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.guestId = +id;
    }
  }

  onSubmit(): void {
    if (this.guestForm.invalid || this.submitting) return;
    this.submitting = true;
    setTimeout(() => {
      this.router.navigate(['/guests']);
    }, 1000);
  }

  onCancel(): void {
    this.router.navigate(['/guests']);
  }
}
