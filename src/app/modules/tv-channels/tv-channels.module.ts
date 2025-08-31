// src/app/modules/tv-channels/tv-channels.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Components
import { TvChannelsListComponent } from './components/tv-channels-list/tv-channels-list.component';
import { TvChannelFormComponent } from './components/tv-channel-form/tv-channel-form.component';
import { TvChannelDetailComponent } from './components/tv-channel-detail/tv-channel-detail.component';

// Services
import { TvChannelService } from '../../core/services/tv-channel.service';
import { LanguageService } from '../../core/services/language.service';
import { TvChannelCategoryService } from '../../core/services/tv-channel-category.service';

// Shared Components (if any)
// import { LoadingComponent } from '../../shared/components/loading/loading.component';

// Guards (if needed)
// import { AuthGuard } from '../../core/guards/auth.guard';
// import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: TvChannelsListComponent,
    data: {
      title: 'TV Channels',
      breadcrumb: 'Channels',
    },
  },
  {
    path: 'add',
    component: TvChannelFormComponent,
    data: {
      title: 'Add Channel',
      breadcrumb: 'Add Channel',
    },
  },
  {
    path: ':id',
    component: TvChannelDetailComponent,
    data: {
      title: 'Channel Details',
      breadcrumb: 'Details',
    },
  },
  {
    path: ':id/edit',
    component: TvChannelFormComponent,
    data: {
      title: 'Edit Channel',
      breadcrumb: 'Edit',
    },
  },
  // Redirect any other routes to the main list
  { path: '**', redirectTo: '', pathMatch: 'full' },
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
  providers: [
    // Services are provided at root level, but we can override here if needed
    TvChannelService,
    LanguageService,
    TvChannelCategoryService,
  ],
  exports: [
    // Export components if they need to be used elsewhere
    TvChannelsListComponent,
    TvChannelFormComponent,
    TvChannelDetailComponent,
  ],
})
export class TvChannelsModule {
  constructor() {
    console.log('TV Channels Module loaded');
  }
}
