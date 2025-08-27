import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { SettingsComponent } from './components/settings.component';
import { GeneralSettingsComponent } from './components/general-settings/general-settings.component';
import { SystemSettingsComponent } from './components/system-settings/system-settings.component';
import { UserManagementComponent } from './components/user-management/user-management.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      { path: 'general', component: GeneralSettingsComponent },
      { path: 'system', component: SystemSettingsComponent },
      { path: 'users', component: UserManagementComponent },
    ],
  },
];

@NgModule({
  declarations: [
    SettingsComponent,
    GeneralSettingsComponent,
    SystemSettingsComponent,
    UserManagementComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class SettingsModule {}
