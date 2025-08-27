import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  currentUser: User | null = null;
  showUserMenu = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // TODO: Get current user from auth service
    this.currentUser = {
      id: 1,
      username: 'admin',
      email: 'admin@tvboot.com',
      firstName: 'Ahmed',
      lastName: 'Admin',
      role: 'ADMIN' as any,
      permissions: [],
      isActive: true,
      avatar: 'assets/images/avatar-default.png',
    };
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

  onLogout(): void {
    this.showUserMenu = false;
    // TODO: Implement logout logic
    console.log('Logout clicked');
    this.router.navigate(['/login']);
  }
}
