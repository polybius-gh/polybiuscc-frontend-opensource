import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, switchMap, take } from 'rxjs/operators';
import { UserSession } from './user_session.type';

@Injectable({
  providedIn: 'root',
})
export class UserSessionService {
  private _userSession: BehaviorSubject<UserSession | null> =
    new BehaviorSubject<UserSession | null>(null);

  baseURL: string = '/api/users';

  constructor(private _httpClient: HttpClient) {}

  // --------------------------------------------------------------------------
  // Accessors
  // --------------------------------------------------------------------------
  set userSession(value: UserSession | null) {
    console.log('setting userSession');
    this._userSession.next(value);
  }

  get userSession$(): Observable<UserSession | null> {
    return this._userSession.asObservable();
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------
  get userSession(): UserSession | null {
    return this._userSession.getValue();
  }

  loadUserSession(sessionID: string): Observable<UserSession> {
    //console.log('loading user session...', sessionID);
    return this._httpClient
      .get<UserSession>(`${this.baseURL}/getUserSession`, {
        params: { sessionID },
        withCredentials: true,
      })
      .pipe(
        tap((session) => {
          // Update the BehaviorSubject so userSession$ stays current
          this._userSession.next(session);
        }),
        catchError((err) => {
          console.error('Failed to load user session:', err);
          // Optionally clear the session if request fails
          this._userSession.next(null);
          return throwError(() => err);
        })
      );
  }
  /**
   * Update one or more properties of the current userSession safely.
   * Example: this.userService.updateCurrentUser({ socket_id: 'abc123' });
   */
  updateUserSession(partial: Partial<UserSession>): void {
    const current = this._userSession.value;
    //console.log('updating userSession:', partial);
    if (current) {
      const updated = { ...current, ...partial };
      this._userSession.next(updated);
    } else {
      console.warn('Tried to update session before userSession was set.');
    }
  }

  changeStatus(sessionID: string, status: string): Observable<any> {
    const updateSession = this._httpClient.patch(
      `${this.baseURL}/changeSessionStatus/${sessionID}/status`,
      { status },
      { withCredentials: true }
    );
    this.updateUserSession({ session_status: status });
    return updateSession;
  }
}
