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

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private _authService: AuthService, private _router: Router) {}

  // canActivate(
  //   route: ActivatedRouteSnapshot,
  //   state: RouterStateSnapshot
  // ): Observable<boolean | UrlTree> {
  //   const attemptedUrl = state.url;

  //   return this._authService.checkSession().pipe(
  //     map((currentUser) => {
  //       if (currentUser) return true;
  //       console.log('[AuthGuard] Not authenticated, redirecting...');
  //       return this._router.createUrlTree(['/login'], {
  //         queryParams: { redirectURL: attemptedUrl },
  //       });
  //     }),
  //     catchError(() =>
  //       of(this._router.createUrlTree(['/login'], { queryParams: { redirectURL: attemptedUrl } }))
  //     )
  //   );
  // }

  canActivate(
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> {
  const attemptedUrl = state.url;

  // If the user is already cached in the client, skip the backend call
  const currentUser = this._authService.currentUserValue; // e.g., BehaviorSubject.value
  if (currentUser) {
    console.log('user authorized...')
    return of(true);
  }

  // Otherwise, check the session with backend
  return this._authService.checkSession().pipe(
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
