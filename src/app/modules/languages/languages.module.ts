import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { LanguagesListComponent } from './components/languages-list/languages-list.component';
import { LanguageFormComponent } from './components/language-form/language-form.component';

const routes: Routes = [
  { path: '', component: LanguagesListComponent },
  { path: 'add', component: LanguageFormComponent },
  { path: ':id/edit', component: LanguageFormComponent },
];

@NgModule({
  declarations: [LanguagesListComponent, LanguageFormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class LanguagesModule {}
