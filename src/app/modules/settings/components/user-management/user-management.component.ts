import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@tvboot.com',
      firstName: 'Ahmed',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
      lastLogin: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: 2,
      username: 'manager',
      email: 'manager@tvboot.com',
      firstName: 'Fatima',
      lastName: 'Manager',
      role: 'MANAGER',
      isActive: true,
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 3,
      username: 'technician',
      email: 'tech@tvboot.com',
      firstName: 'Mohamed',
      lastName: 'Technician',
      role: 'TECHNICIAN',
      isActive: false,
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ];

  filteredUsers = [...this.users];
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';

  roles = [
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'RECEPTIONIST', label: 'Receptionist' },
    { value: 'TECHNICIAN', label: 'Technician' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter((user) => {
      const matchesSearch =
        !this.searchTerm ||
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = !this.roleFilter || user.role === this.roleFilter;
      const matchesStatus =
        !this.statusFilter ||
        (this.statusFilter === 'active' && user.isActive) ||
        (this.statusFilter === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  toggleUserStatus(id: number): void {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.isActive = !user.isActive;
      this.applyFilters();
    }
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users = this.users.filter((u) => u.id !== id);
      this.applyFilters();
    }
  }

  addUser(): void {
    // Would normally open a user form dialog or navigate to user form
    console.log('Add user clicked');
    alert('User form would open here');
  }

  editUser(id: number): void {
    // Would normally open a user form dialog or navigate to user form
    console.log('Edit user clicked:', id);
    alert('User edit form would open here');
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  getRoleLabel(role: string): string {
    const roleObj = this.roles.find((r) => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  getLastLoginText(lastLogin?: Date): string {
    if (!lastLogin) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}
