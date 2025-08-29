// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './auth/components/login/login.component';

// Guards
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { GuestGuard } from './core/guards/guest.guard';

// Error Components
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';

const routes: Routes = [
  // Auth Routes (accessible only when not logged in)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard],
    data: { title: 'Login' },
  },

  // Protected Routes (require authentication)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

      // Dashboard - All authenticated users
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./modules/dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
        data: { title: 'Dashboard' },
      },

      // TV Channels - All authenticated users
      {
        path: 'channels',
        loadChildren: () =>
          import('./modules/tv-channels/tv-channels.module').then(
            (m) => m.TvChannelsModule
          ),
        data: { title: 'TV Channels' },
      },

      // Terminals - Technicians, Admins, Managers
      {
        path: 'terminals',
        loadChildren: () =>
          import('./modules/terminals/terminals.module').then(
            (m) => m.TerminalsModule
          ),
        canActivate: [RoleGuard],
        data: {
          title: 'Terminals',
          roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'],
        },
      },

      // Guests - All authenticated users except technicians
      {
        path: 'guests',
        loadChildren: () =>
          import('./modules/guests/guests.module').then((m) => m.GuestsModule),
        canActivate: [RoleGuard],
        data: {
          title: 'Guests',
          roles: ['ADMIN', 'MANAGER', 'RECEPTIONIST'],
        },
      },

      // Rooms - All authenticated users except technicians
      {
        path: 'rooms',
        loadChildren: () =>
          import('./modules/rooms/rooms.module').then((m) => m.RoomsModule),
        canActivate: [RoleGuard],
        data: {
          title: 'Rooms',
          roles: ['ADMIN', 'MANAGER', 'RECEPTIONIST'],
        },
      },

      // Reservations - All authenticated users except technicians
      {
        path: 'reservations',
        loadChildren: () =>
          import('./modules/reservations/reservations.module').then(
            (m) => m.ReservationsModule
          ),
        canActivate: [RoleGuard],
        data: {
          title: 'Reservations',
          roles: ['ADMIN', 'MANAGER', 'RECEPTIONIST'],
        },
      },

      // Packages - Admins and Managers only
      {
        path: 'packages',
        loadChildren: () =>
          import('./modules/packages/packages.module').then(
            (m) => m.PackagesModule
          ),
        canActivate: [RoleGuard],
        data: {
          title: 'Packages',
          roles: ['ADMIN', 'MANAGER'],
        },
      },

      // Languages - Admins and Managers only
      {
        path: 'languages',
        loadChildren: () =>
          import('./modules/languages/languages.module').then(
            (m) => m.LanguagesModule
          ),
        canActivate: [RoleGuard],
        data: {
          title: 'Languages',
          roles: ['ADMIN', 'MANAGER'],
        },
      },

      // Settings - Admins only
      {
        path: 'settings',
        loadChildren: () =>
          import('./modules/settings/settings.module').then(
            (m) => m.SettingsModule
          ),
        canActivate: [RoleGuard],
        data: {
          title: 'Settings',
          roles: ['ADMIN'],
        },
      },
    ],
  },

  // Error Pages
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    data: { title: 'Access Denied' },
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
    data: { title: 'Page Not Found' },
  },

  // Catch all - redirect to not found
  { path: '**', redirectTo: '/not-found' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      enableTracing: false, // Set to true for debugging
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
