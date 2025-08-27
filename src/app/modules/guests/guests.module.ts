import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { GuestsListComponent } from './components/guests-list/guests-list.component';
import { GuestFormComponent } from './components/guest-form/guest-form.component';
import { GuestDetailComponent } from './components/guest-detail/guest-detail.component';
import { CheckinComponent } from './components/checkin/checkin.component';
import { CheckoutComponent } from './components/checkout/checkout.component';

const routes: Routes = [
  { path: '', component: GuestsListComponent },
  { path: 'add', component: GuestFormComponent },
  { path: 'checkin', component: CheckinComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: ':id', component: GuestDetailComponent },
  { path: ':id/edit', component: GuestFormComponent },
];

@NgModule({
  declarations: [
    GuestsListComponent,
    GuestFormComponent,
    GuestDetailComponent,
    CheckinComponent,
    CheckoutComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class GuestsModule {}
