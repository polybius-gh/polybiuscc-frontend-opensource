import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { User } from '../user/user.types';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
  constructor(private _authService: AuthService, private _router: Router) {}

  // canActivate(): Observable<boolean | UrlTree> {
  //   return this.authService.getCurrentUser().pipe(
  //     map((user: User | null) => {
  //       if (user) {
  //         // Already logged in → redirect to dashboard or home
  //         return this.router.createUrlTree(['/dashboard']);
  //       }
  //       return true; // allow access
  //     })
  //   );
  // }

  // noAuth.guard.ts
canActivate(): Observable<boolean | UrlTree> {
  return this._authService.checkSession().pipe(
    map((user) => (user ? this._router.createUrlTree(['/dashboard']) : true))
  );
}

}
