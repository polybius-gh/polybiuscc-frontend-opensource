// auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { UserSessionService } from '../userSession/user_session.service';
import { User } from '../user/user.types';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private _authService: AuthService, private _router: Router, private _userSessionService: UserSessionService) {}

  canActivate(
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> {
  console.log('auth guard running...');
  const attemptedUrl = state.url;

  if (this._authService._loggingOut) {
    console.log('[AuthGuard] Skipping guard during logout');
    return of(false);
  }

  // If the user is already cached in the client, skip the backend call
  const userSession = this._userSessionService.userSession; // e.g., BehaviorSubject.value
  if (userSession) {
    console.log('user authorized...')
    return of(true);
  }

  // Otherwise, check the session with backend
  return this._authService.checkUserSession().pipe(
    map((user) => {
      if (user) return true;
      console.log('[AuthGuard] Not authenticated, redirecting...');
      return this._router.createUrlTree(['/login'], {
        queryParams: { redirectURL: attemptedUrl },
      });
    }),
    catchError(() =>
      of(
        this._router.createUrlTree(['/login'], {
          queryParams: { redirectURL: attemptedUrl },
        })
      )
    )
  );
}
}
