import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { RoomsListComponent } from './components/rooms-list/rooms-list.component';
import { RoomDetailComponent } from './components/room-detail/room-detail.component';
import { RoomFormComponent } from './room-form/room-form.component';
import { RoomStatusComponent } from './components/room-status/room-status.component';

const routes: Routes = [
  {
    path: '',
    component: RoomsListComponent,
    data: {
      title: 'Rooms',
      breadcrumb: 'Rooms',
    },
  },
  {
    path: 'status-management',
    component: RoomStatusComponent,
    data: {
      title: 'Room Status Management',
      breadcrumb: 'Status Management',
    },
  },
  {
    path: 'add',
    component: RoomFormComponent,
    data: {
      title: 'Add Room',
      breadcrumb: 'Add Room',
    },
  },
  {
    path: ':id',
    component: RoomDetailComponent,
    data: {
      title: 'Room Details',
      breadcrumb: 'Details',
    },
  },
  {
    path: ':id/edit',
    component: RoomFormComponent,
    data: {
      title: 'Edit Room',
      breadcrumb: 'Edit',
    },
  },
  // Redirect any other routes to the main list
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  declarations: [
    RoomsListComponent, 
    RoomFormComponent, 
    RoomDetailComponent,
    RoomStatusComponent,
    RoomStatusComponent  // Ajoutez le nouveau composant ici
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class RoomsModule {}