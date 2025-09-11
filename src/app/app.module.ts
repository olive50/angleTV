// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Layout Components
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

// Shared Components
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { ConfirmDialogComponent } from './shared/components/confirm/confirm-dialog.component';

// Error Components
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';

// Auth Components
import { LoginComponent } from './auth/components/login/login.component';

// Interceptors
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

// Services
import { JwtAuthService } from './core/services/jwt-auth.service';

@NgModule({ declarations: [
        AppComponent,
        MainLayoutComponent,
        HeaderComponent,
        SidebarComponent,
        FooterComponent,
        LoadingComponent,
        UnauthorizedComponent,
        NotFoundComponent,
        LoginComponent,
        ToastContainerComponent,
        ConfirmDialogComponent,
    ],
    exports: [LoadingComponent],
    bootstrap: [AppComponent], imports: [BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        ReactiveFormsModule,
        FormsModule,
        CommonModule], providers: [
        // JWT Interceptor - Order matters!
        {
            provide: HTTP_INTERCEPTORS,
            useClass: JwtInterceptor,
            multi: true,
        },
        // Error Interceptor
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true,
        },
        // Services
        JwtAuthService,
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule {}
