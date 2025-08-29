// src/app/core/services/auth.service.ts
// Remplace le contenu existant par celui-ci pour éviter les conflits

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User } from '../models/user.model';
import { JwtAuthService } from './jwt-auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private jwtAuthService: JwtAuthService
  ) {
    // Delegate to JwtAuthService for authentication
    this.jwtAuthService.currentUser$.subscribe(user => {
      this.currentUserSubject.next(user);
    });

    this.jwtAuthService.isAuthenticated$.subscribe(isAuthenticated => {
      this.isAuthenticatedSubject.next(isAuthenticated);
    });
  }

  login(username: string, password: string): Observable<boolean> {
    return this.jwtAuthService.login({ username, password })
      .pipe(
        map(response => {
          return !!response.token;