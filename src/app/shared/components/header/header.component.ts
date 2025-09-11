import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { ConfirmService } from '../../components/confirm/confirm.service';
import { ToastService } from '../../components/toast/toast.service';

export interface User {
  id?: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  avatar?: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  currentUser: User | null = null;
  showUserMenu = false;

  private destroy$ = new Subject<void>();

  constructor(private router: Router, private authService: JwtAuthService, private confirm: ConfirmService, private toast: ToastService) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
      });

    // Close user menu when clicking outside
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  onProfile(): void {
    this.showUserMenu = false;
    this.router.navigate(['/profile']);
  }

  onSettings(): void {
    this.showUserMenu = false;
    this.router.navigate(['/settings']);
  }

  async onLogout(): Promise<void> {
    this.showUserMenu = false;

    const ok = await this.confirm.open('Logout', 'Are you sure you want to logout?', 'Logout', 'Cancel');
    if (!ok) return;

    console.log('User logging out...');
    this.authService.logout();
    this.toast.info('You have been logged out');
  }

  private onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const userMenuElement = document.querySelector('.user-menu');

    if (userMenuElement && !userMenuElement.contains(target)) {
      this.showUserMenu = false;
    }
  }

  // Helper methods for template
  getUserDisplayName(): string {
    if (!this.currentUser) return 'User';
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const firstInitial = this.currentUser.firstName?.charAt(0) || '';
    const lastInitial = this.currentUser.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  getRoleDisplayName(): string {
    if (!this.currentUser) return '';

    const roleMap: { [key: string]: string } = {
      ADMIN: 'Administrator',
      MANAGER: 'Manager',
      RECEPTIONIST: 'Receptionist',
      TECHNICIAN: 'Technician',
    };

    return roleMap[this.currentUser.role] || this.currentUser.role;
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }
}
