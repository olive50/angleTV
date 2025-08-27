import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { RoomsListComponent } from './components/rooms-list/rooms-list.component';

import { RoomDetailComponent } from './components/room-detail/room-detail.component';
import { RoomFormComponent } from './room-form/room-form.component';

const routes: Routes = [
  { path: '', component: RoomsListComponent },
  { path: 'add', component: RoomFormComponent },
  { path: ':id', component: RoomDetailComponent },
  { path: ':id/edit', component: RoomFormComponent },
];

@NgModule({
  declarations: [RoomsListComponent, RoomFormComponent, RoomDetailComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class RoomsModule {}
