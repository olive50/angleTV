// src/app/modules/tv-channels/tv-channels.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { TvChannelsListComponent } from './components/tv-channels-list/tv-channels-list.component';
import { TvChannelFormComponent } from './components/tv-channel-form/tv-channel-form.component';
import { TvChannelDetailComponent } from './components/tv-channel-detail/tv-channel-detail.component';

// Import shared components
import { LoadingComponent } from '../../shared/components/loading/loading.component';

const routes: Routes = [
  { path: '', component: TvChannelsListComponent },
  { path: 'add', component: TvChannelFormComponent },
  { path: ':id', component: TvChannelDetailComponent },
  { path: ':id/edit', component: TvChannelFormComponent },
];

@NgModule({
  declarations: [
    TvChannelsListComponent,
    TvChannelFormComponent,
    TvChannelDetailComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class TvChannelsModule {}
