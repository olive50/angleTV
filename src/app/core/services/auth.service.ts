import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Check if user is logged in on service initialization
    this.checkAuthStatus();
  }

  login(username: string, password: string): Observable<boolean> {
    // TODO: Implement actual login logic with backend
    return new Observable((observer) => {
      // Simulate API call
      setTimeout(() => {
        if (username === 'admin' && password === 'admin') {
          const user: User = {
            id: 1,
            username: 'admin',
            email: 'admin@tvboot.com',
            firstName: 'Ahmed',
            lastName: 'Admin',
            role: 'ADMIN' as any,
            permissions: [],
            isActive: true,
            lastLogin: new Date(),
            avatar: 'assets/images/avatar-default.png',
          };

          this.setCurrentUser(user);
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 1000);
    });
  }

  logout(): void {
    // Clear user data
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private checkAuthStatus(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }
}
