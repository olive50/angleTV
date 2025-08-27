import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./modules/dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
      },
      {
        path: 'channels',
        loadChildren: () =>
          import('./modules/tv-channels/tv-channels.module').then(
            (m) => m.TvChannelsModule
          ),
      },
      {
        path: 'terminals',
        loadChildren: () =>
          import('./modules/terminals/terminals.module').then(
            (m) => m.TerminalsModule
          ),
      },
      {
        path: 'guests',
        loadChildren: () =>
          import('./modules/guests/guests.module').then((m) => m.GuestsModule),
      },
      {
        path: 'rooms',
        loadChildren: () =>
          import('./modules/rooms/rooms.module').then((m) => m.RoomsModule),
      },
      {
        path: 'reservations',
        loadChildren: () =>
          import('./modules/reservations/reservations.module').then(
            (m) => m.ReservationsModule
          ),
      },
      {
        path: 'packages',
        loadChildren: () =>
          import('./modules/packages/packages.module').then(
            (m) => m.PackagesModule
          ),
      },
      {
        path: 'languages',
        loadChildren: () =>
          import('./modules/languages/languages.module').then(
            (m) => m.LanguagesModule
          ),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./modules/settings/settings.module').then(
            (m) => m.SettingsModule
          ),
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
