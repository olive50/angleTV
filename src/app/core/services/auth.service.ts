// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, UserRole, Permission } from '../models/user.model';
import { JwtAuthService, LoginRequest } from './jwt-auth.service';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  // Subjects pour l'état d'authentification
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private jwtAuthService: JwtAuthService,
    private router: Router
  ) {
    // Synchroniser avec JwtAuthService
    this.initializeAuthState();
  }

  /**
   * Initialise l'état d'authentification en synchronisant avec JwtAuthService
   */
  private initializeAuthState(): void {
    // Synchroniser l'utilisateur actuel
    this.jwtAuthService.currentUser$.subscribe((user) => {
      this.currentUserSubject.next(user);
    });

    // Synchroniser l'état d'authentification
    this.jwtAuthService.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isAuthenticatedSubject.next(isAuthenticated);
    });

    // Synchroniser l'état de chargement
    this.jwtAuthService.isLoading$.subscribe((isLoading) => {
      this.isLoadingSubject.next(isLoading);
    });
  }

  /**
   * Connexion utilisateur
   */
  login(username: string, password: string): Observable<boolean> {
    const credentials: LoginRequest = { username, password };

    return this.jwtAuthService.login(credentials).pipe(
      map((response) => {
        console.log('Login successful via AuthService:', response);
        return !!response.token;
      }),
      catchError((error) => {
        console.error('Login failed via AuthService:', error);
        return of(false);
      })
    );
  }

  /**
   * Connexion avec objet credentials complet
   */
  authenticate(credentials: LoginRequest): Observable<AuthResponse> {
    return this.jwtAuthService.login(credentials).pipe(
      map((jwtResponse) => ({
        success: true,
        message: 'Authentication successful',
        user: {
          username: jwtResponse.username,
          email: jwtResponse.email,
          firstName: jwtResponse.firstName,
          lastName: jwtResponse.lastName,
          role: jwtResponse.role as UserRole,
          permissions: [], // À remplir selon votre logique
          isActive: jwtResponse.isActive,
        },
        token: jwtResponse.token,
      })),
      catchError((error) =>
        of({
          success: false,
          message: error.message || 'Authentication failed',
        })
      )
    );
  }

  /**
   * Déconnexion
   */
  logout(): Observable<boolean> {
    try {
      this.jwtAuthService.logout();
      return of(true);
    } catch (error) {
      console.error('Logout error:', error);
      return of(false);
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData).pipe(
      map((response) => ({
        success: true,
        message: 'Registration successful',
        user: response.user,
        token: response.token,
      })),
      catchError((error) =>
        of({
          success: false,
          message: error.error?.message || 'Registration failed',
        })
      )
    );
  }

  /**
   * Rafraîchir le token d'authentification
   */
  refreshToken(): Observable<boolean> {
    return this.jwtAuthService.refreshUser().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Obtenir l'utilisateur actuellement connecté
   */
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Obtenir l'utilisateur actuel de manière synchrone
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return this.jwtAuthService.isAuthenticated();
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUserValue();
    return user ? user.role === role : false;
  }

  /**
   * Vérifier si l'utilisateur a une permission spécifique
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUserValue();
    if (!user) return false;

    return user.permissions.some((p) => p.name === permission);
  }

  /**
   * Vérifier si l'utilisateur peut accéder à une ressource
   */
  canAccess(resource: string, action: string): boolean {
    const user = this.getCurrentUserValue();
    if (!user) return false;

    return user.permissions.some(
      (p) => p.resource === resource && p.action === action
    );
  }

  /**
   * Vérifier si l'utilisateur est administrateur
   */
  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  /**
   * Vérifier si l'utilisateur est manager
   */
  isManager(): boolean {
    return this.hasRole(UserRole.MANAGER);
  }

  /**
   * Vérifier si l'utilisateur est réceptionniste
   */
  isReceptionist(): boolean {
    return this.hasRole(UserRole.RECEPTIONIST);
  }

  /**
   * Vérifier si l'utilisateur est technicien
   */
  isTechnician(): boolean {
    return this.hasRole(UserRole.TECHNICIAN);
  }

  /**
   * Obtenir le token JWT
   */
  getToken(): string | null {
    return this.jwtAuthService.getToken();
  }

  /**
   * Changer le mot de passe
   */
  changePassword(
    changePasswordData: ChangePasswordRequest
  ): Observable<AuthResponse> {
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      return of({
        success: false,
        message: 'New passwords do not match',
      });
    }

    return this.http
      .post<any>(`${this.apiUrl}/auth/change-password`, {
        currentPassword: changePasswordData.currentPassword,
        newPassword: changePasswordData.newPassword,
      })
      .pipe(
        map(() => ({
          success: true,
          message: 'Password changed successfully',
        })),
        catchError((error) =>
          of({
            success: false,
            message: error.error?.message || 'Failed to change password',
          })
        )
      );
  }

  /**
   * Demander une réinitialisation de mot de passe
   */
  requestPasswordReset(
    resetData: ResetPasswordRequest
  ): Observable<AuthResponse> {
    return this.http
      .post<any>(`${this.apiUrl}/auth/forgot-password`, resetData)
      .pipe(
        map(() => ({
          success: true,
          message: 'Password reset email sent successfully',
        })),
        catchError((error) =>
          of({
            success: false,
            message: error.error?.message || 'Failed to send reset email',
          })
        )
      );
  }

  /**
   * Confirmer la réinitialisation de mot de passe
   */
  confirmPasswordReset(
    token: string,
    newPassword: string
  ): Observable<AuthResponse> {
    return this.http
      .post<any>(`${this.apiUrl}/auth/reset-password`, {
        token,
        newPassword,
      })
      .pipe(
        map(() => ({
          success: true,
          message: 'Password reset successfully',
        })),
        catchError((error) =>
          of({
            success: false,
            message: error.error?.message || 'Failed to reset password',
          })
        )
      );
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  updateProfile(profileData: Partial<User>): Observable<AuthResponse> {
    return this.http.put<any>(`${this.apiUrl}/auth/profile`, profileData).pipe(
      tap((response) => {
        // Mettre à jour l'utilisateur local
        if (response.user) {
          this.currentUserSubject.next(response.user);
        }
      }),
      map((response) => ({
        success: true,
        message: 'Profile updated successfully',
        user: response.user,
      })),
      catchError((error) =>
        of({
          success: false,
          message: error.error?.message || 'Failed to update profile',
        })
      )
    );
  }

  /**
   * Vérifier l'état du token
   */
  checkTokenStatus(): Observable<boolean> {
    if (!this.getToken()) {
      return of(false);
    }

    return this.http.get<any>(`${this.apiUrl}/auth/verify-token`).pipe(
      map(() => true),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  /**
   * Obtenir les permissions de l'utilisateur
   */
  getUserPermissions(): Observable<Permission[]> {
    return this.http
      .get<Permission[]>(`${this.apiUrl}/auth/permissions`)
      .pipe(catchError(() => of([])));
  }

  /**
   * Vérifier si le token va expirer bientôt
   */
  isTokenExpiringSoon(): boolean {
    return this.jwtAuthService.isTokenAboutToExpire();
  }

  /**
   * Obtenir les informations de session
   */
  getSessionInfo(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/auth/session-info`)
      .pipe(catchError(() => of(null)));
  }

  /**
   * Terminer toutes les sessions
   */
  logoutAllSessions(): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/auth/logout-all`, {}).pipe(
      tap(() => this.logout()),
      map(() => ({
        success: true,
        message: 'All sessions terminated',
      })),
      catchError((error) =>
        of({
          success: false,
          message: error.error?.message || 'Failed to logout all sessions',
        })
      )
    );
  }

  /**
   * Vérifier si l'utilisateur peut effectuer une action sur une ressource
   */
  canPerformAction(resource: string, action: string): boolean {
    const user = this.getCurrentUserValue();
    if (!user) return false;

    // Vérification par rôle
    if (user.role === UserRole.ADMIN) {
      return true; // Admin peut tout faire
    }

    // Vérification par permission spécifique
    return this.canAccess(resource, action);
  }

  /**
   * Obtenir le nom d'affichage de l'utilisateur
   */
  getUserDisplayName(): string {
    const user = this.getCurrentUserValue();
    if (!user) return 'Unknown User';

    return `${user.firstName} ${user.lastName}`.trim() || user.username;
  }

  /**
   * Obtenir les initiales de l'utilisateur
   */
  getUserInitials(): string {
    const user = this.getCurrentUserValue();
    if (!user) return 'U';

    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';

    return (
      (firstInitial + lastInitial).toUpperCase() ||
      user.username.charAt(0).toUpperCase()
    );
  }

  /**
   * Vérifier si l'utilisateur est actif
   */
  isUserActive(): boolean {
    const user = this.getCurrentUserValue();
    return user ? user.isActive : false;
  }

  /**
   * Obtenir la dernière connexion
   */
  getLastLogin(): Date | null {
    const user = this.getCurrentUserValue();
    return user?.lastLogin || null;
  }
}
