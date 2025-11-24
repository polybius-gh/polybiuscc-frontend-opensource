import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { UserSessionService } from '../userSession/user_session.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private _checking = false; // prevent recursive loops

  constructor(
    protected _authService: AuthService,
    protected _router: Router,
    protected _userSessionService: UserSessionService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    //console.log('auth guard running...');
    const attemptedUrl = state.url;

    if (this._authService._loggingOut) {
      console.log('[AuthGuard] Skipping guard during logout');
      return of(false);
    }

    if (this._checking) {
      console.log('[AuthGuard] Preventing reentrant check');
      return of(false);
    }

    this._checking = true;

    return this._userSessionService.userSession$.pipe(
      filter(session => session !== undefined), // wait for initialization
      take(1),
      switchMap(session => {
        if (session) {
          //console.log('user authorized...', session);
          this._checking = false;
          return of(true);
        }

        console.log('checking user session with backend...');
        return this._authService.checkUserSession().pipe(
          map(user => {
            this._checking = false;
            if (user) return true;
            console.log('[AuthGuard] Not authenticated, redirecting...');
            return this._router.createUrlTree(['/login'], {
              queryParams: { redirectURL: attemptedUrl },
            });
          }),
          catchError(() => {
            this._checking = false;
            return of(
              this._router.createUrlTree(['/login'], {
                queryParams: { redirectURL: attemptedUrl },
              })
            );
          })
        );
      })
    );
  }
}
