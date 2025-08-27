import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { TerminalsListComponent } from './components/terminals-list/terminals-list.component';
import { TerminalFormComponent } from './components/terminal-form/terminal-form.component';
import { TerminalDetailComponent } from './components/terminal-detail/terminal-detail.component';

const routes: Routes = [
  { path: '', component: TerminalsListComponent },
  { path: 'add', component: TerminalFormComponent },
  { path: ':id', component: TerminalDetailComponent },
  { path: ':id/edit', component: TerminalFormComponent },
];

@NgModule({
  declarations: [
    TerminalsListComponent,
    TerminalFormComponent,
    TerminalDetailComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class TerminalsModule {}
