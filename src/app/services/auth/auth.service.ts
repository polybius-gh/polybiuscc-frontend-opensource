//auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  Observable,
  of,
  throwError,
  firstValueFrom,
  shareReplay,
  BehaviorSubject,
  from,
  map,
} from 'rxjs';
import { switchMap, take, tap, catchError } from 'rxjs/operators';
import { SocketService } from '../socket/socket.service';
//import { UserService } from '../user/user.service';
import { CallDataService } from '../callData/calldata.service';
import { UserSession } from '../userSession/user_session.type';
import { UserSessionService } from '../userSession/user_session.service';
//import { HeartbeatService } from '../monitors/heatbeat.service';

@Injectable({ providedIn: 'root' })
@Injectable({ providedIn: 'root' })
export class AuthService {
  public _authenticated = false;
  public _loggingOut = false;
  private _userSession = new BehaviorSubject<UserSession | null>(null);
  userSession$ = this._userSession.asObservable();

  constructor(
    private _httpClient: HttpClient,
    //private _userService: UserService,
    private _socketService: SocketService,
    private _callDataService: CallDataService,
    private _userSessionService: UserSessionService,
    //private _heartbeatService: HeartbeatService,
    private _router: Router
  ) {}

  /** Login: server sets HTTP-only cookie */
  signIn(credentials: { username: string; password: string }): Observable<any> {
    console.log('signing in...');

    if (this._authenticated) {
      return throwError(() => new Error('User is already logged in.'));
    }

    return this._httpClient.post(`${environment.apiBaseUrl}/users/login`, credentials).pipe(
      switchMap(async (res: any) => {
        //console.log('signIn response:', res);
        this._authenticated = true;

        try {
          // 1️⃣ Load user session and wait for it to complete
          const session = await firstValueFrom(
            this._userSessionService.loadUserSession(res.session_id)
          );
          //console.log('session loaded:', session);

          // 2️⃣ Connect socket and wait for it to complete
          const socketID = await this._socketService.socketConnect(res.session_id);
          //console.log('Connected, socketID:', socketID);

          // 3️⃣ Update session with socket ID
          this._userSessionService.updateUserSession({ socket_id: socketID });

          //initialize heartbeat
          //this._heartbeatService.start();

          // 4️⃣ Return original login response after all is ready
          return res;
        } catch (err) {
          console.error('Error during session load or socket connect:', err);
          throw err; // propagate error to caller
        }
      })
    );
  }

  /** Logout: server clears cookie */
  // signOut(): Observable<any> {
  //   return this._httpClient
  //     .post(`${environment.apiBaseUrl}/users/logout`, {}, { withCredentials: true })
  //     .pipe(
  //       switchMap(() => {
  //         this._authenticated = false;
  //         this._userSessionService.userSession = null;
  //         return of(true);
  //       })
  //     );
  // }

  signOut(): Observable<any> {
    // Clear client-side state immediately
    this._loggingOut = true;
    console.log('this._loggingOut:', this._loggingOut);
    this._authenticated = false;
    this._userSessionService.userSession = null;

    // Call backend to clear cookie, ignore response
    return this._httpClient
      .post(`${environment.apiBaseUrl}/users/logout`, {}, { withCredentials: true })
      .pipe(
        catchError(() => of(false)), // ignore errors
        switchMap(() => of(true))
      );

    this._router.navigate(['/login']);
  }

  checkUserSession(): Observable<UserSession | null> {
    return this._httpClient
      .get<{ session_id: string }>(`${environment.apiBaseUrl}/users/me`, { withCredentials: true })
      .pipe(
        switchMap((res) => {
          if (!res?.session_id) {
            console.log('[AuthService] /me returned no session_id');
            this._authenticated = false;
            this._userSessionService.userSession = null;
            return of(null);
          }

          this._authenticated = true;

          // Load full session like signIn
          return from(this._userSessionService.loadUserSession(res.session_id)).pipe(
            switchMap((session) => {
              if (!session) {
                this._authenticated = false;
                this._userSessionService.userSession = null;
                return of(null);
              }

              //console.log('[AuthService] Session loaded:', session);

              // Connect socket
              return from(this._socketService.socketConnect(res.session_id)).pipe(
                tap((socketID) => {
                  console.log('[AuthService] Connected, socketID:', socketID);
                  this._userSessionService.updateUserSession({ socket_id: socketID });
                }),
                // Optional: start heartbeat if you want it on refresh
                //tap(() => this._heartbeatService.start()),
                map(() => session)
              );
            })
          );
        }),
        catchError((err) => {
          console.warn('[AuthService] checkUserSession failed:', err?.status);
          this._authenticated = false;
          this._userSessionService.userSession = null;
          return of(null);
        }),
        shareReplay(1)
      );
  }

  // checkUserSession(): Observable<UserSession | null> {
  //   return this._httpClient
  //     .get<UserSession>(`${environment.apiBaseUrl}/users/me`, { withCredentials: true })
  //     .pipe(
  //       switchMap((userSession) => {
  //         if (!userSession) {
  //           console.log('[AuthService] No user returned from /me');
  //           this._authenticated = false;
  //           this._userSessionService.userSession = null;
  //           return of(null);
  //         }

  //         console.log('[AuthService] Session loaded:', userSession);
  //         this._authenticated = true;

  //         // Set session immediately
  //         this._userSessionService.userSession = userSession;

  //         // Convert Promise<string> to Observable<string>
  //         return from(this._socketService.socketConnect(userSession.id)).pipe(
  //           tap((socketID: string) => {
  //             console.log('[AuthService] Connected, socketID:', socketID);
  //             // Update session safely
  //             this._userSessionService.updateUserSession({ socket_id: socketID });
  //           }),
  //           map(() => userSession)
  //         );
  //       }),
  //       catchError((err) => {
  //         console.warn('[AuthService] /me failed:', err?.status);
  //         this._authenticated = false;
  //         this._userSessionService.userSession = null;
  //         return of(null);
  //       }),
  //       shareReplay(1)
  //     );
  // }
}
