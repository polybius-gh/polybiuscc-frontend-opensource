import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { UserSessionService } from '../userSession/user_session.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private _authService: AuthService,
    private _router: Router,
    private _userSessionService: UserSessionService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const requiredRoles: string[] = route.data['roles'] || [];

    return this._userSessionService.userSession$.pipe(
      take(1),
      map((session) => {
        if (!session) {
          console.log('[RoleGuard] No session, redirecting to login...');
          return this._router.createUrlTree(['/login'], {
            queryParams: { redirectURL: state.url },
          });
        }

        // No role restriction → any logged-in user passes
        if (requiredRoles.length === 0) return true;

        // Check if security_level matches
        if (requiredRoles.includes(session.security_level)) return true;

        console.log('[RoleGuard] Not authorized for this role, redirecting...');
        return this._router.createUrlTree(['/dashboard']);
      })
    );
  }
}
