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
export class RoleGuard implements CanActivate {
  constructor(private authService: JwtAuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const requiredRoles = route.data['roles'] as string[];

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role requirement
    }

    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          console.log('No user found, redirecting to login');
          return this.router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          });
        }

        const hasRequiredRole = requiredRoles.includes(user.role);

        if (!hasRequiredRole) {
          console.warn(
            `Access denied. Required roles: ${requiredRoles}, User role: ${user.role}`
          );
          return this.router.createUrlTree(['/unauthorized']);
        }

        return true;
      })
    );
  }
}
