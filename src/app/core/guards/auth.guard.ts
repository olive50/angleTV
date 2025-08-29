import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { JwtAuthService } from '../services/jwt-auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: JwtAuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map((isAuthenticated) => {
        if (isAuthenticated) {
          // Check if token is about to expire
          if (this.authService.isTokenAboutToExpire()) {
            console.warn('Token is about to expire, redirecting to login');
            this.authService.logout();
            return this.router.createUrlTree(['/login'], {
              queryParams: { returnUrl: state.url, reason: 'expired' },
            });
          }
          return true;
        } else {
          console.log('User not authenticated, redirecting to login');
          return this.router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          });
        }
      })
    );
  }
}
