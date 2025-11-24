// admin.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { UserSessionService } from '../userSession/user_session.service';
import { AuthGuard } from './auth.guard';

@Injectable({ providedIn: 'root' })
export class AdminGuard extends AuthGuard implements CanActivate {
  constructor(
    protected override _authService: AuthService,
    protected override _router: Router,
    protected override _userSessionService: UserSessionService
  ) {
    super(_authService, _router, _userSessionService);
  }

  override canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return super.canActivate(route, state).pipe(
      switchMap(authResult => {
        console.log('admin guard running...', authResult);
        debugger;
        // If base auth fails or redirects, honor that
        if (authResult instanceof UrlTree || authResult === false) {
          return of(authResult);
        }

        // Check userSession after AuthGuard success
        return this._userSessionService.userSession$.pipe(
          map(session => {
            if (session?.security_level === 'Admin') {
              return true;
            }

            console.log('[AdminGuard] Non-admin, redirecting to dashboard');
            return this._router.createUrlTree(['/dashboard']);
          }),
          // Only need the latest value
          // Note: if you add 'take(1)', the guard won't re-fire
        );
      })
    );
  }
}
