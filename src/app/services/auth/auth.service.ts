//auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import {
  Observable,
  of,
  throwError,
  firstValueFrom,
  shareReplay,
  BehaviorSubject,
} from 'rxjs';
import { switchMap, take, tap, catchError } from 'rxjs/operators';
import { SocketService } from '../socket/socket.service';
import { UserService } from '../user/user.service';
import { SipService, SipConfig } from '../jssip/jssip.service';
import { CallDataService } from '../callData/calldata.service';
import { CurrentUser } from '../user/currentUser.types';
import { UserSession } from '../userSession/user_session.types';
import { UserSessionService } from '../userSession/user_session.service';

@Injectable({ providedIn: 'root' })
@Injectable({ providedIn: 'root' })
export class AuthService {
  public _authenticated = false;

  private _userSession = new BehaviorSubject<UserSession | null>(null);
  userSession$ = this._userSession.asObservable();

  private _currentUser = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this._currentUser.asObservable();

  private _meRequest$?: Observable<CurrentUser | null>;

  constructor(
    private _httpClient: HttpClient,
    private _userService: UserService,
    private _socketService: SocketService,
    private _sipService: SipService,
    private _callDataService: CallDataService,
    private _userSessionService: UserSessionService,
    private _router: Router,
  ) {}

  /**
   * Normalize backend user response to always be flat CurrentUser
   * (unwraps `{ user: {...} }` from backend)
   */
  private normalizeUserResponse(res: any): CurrentUser | null {
    if (!res) return null;
    // If the backend sends { user: {...} }, unwrap it
    return res.user ?? res;
  }

  get currentUserValue(): CurrentUser | null {
    return this._currentUser.value;
  }

  get userSessionValue(): UserSession | null {
    return this._userSession.value;
  }

  /** Login: server sets HTTP-only cookie */
  signIn(credentials: { username: string; password: string }): Observable<any> {
  console.log('signing in...');

  if (this._authenticated) {
    return throwError(() => new Error('User is already logged in.'));
  }

  return this._httpClient.post(`${environment.apiBaseUrl}/users/login`, credentials).pipe(
    switchMap(async (res: any) => {
      console.log('signIn response:', res);
      this._authenticated = true;

      try {
        // 1️⃣ Load user session and wait for it to complete
        const session = await firstValueFrom(
          this._userSessionService.loadUserSession(res.session_id)
        );
        console.log('session loaded:', session);

        // 2️⃣ Connect socket and wait for it to complete
        const socketID = await this._socketService.socketConnect(res.session_id);
        console.log('Connected, socketID:', socketID);

        // 3️⃣ Update session with socket ID
        this._userSessionService.updateUserSession({ socket_id: socketID });

        // 4️⃣ Return original login response after all is ready
        return res;
      } catch (err) {
        console.error('Error during session load or socket connect:', err);
        throw err; // propagate error to caller
      }
    })
  );
}


  // signIn(credentials: { username: string; password: string }): Observable<any> {
  //   console.log('signing in...');
  //   // Throw error, if the user is already logged in
  //   if (this._authenticated) {
  //     return throwError('User is already logged in.');
  //   }

  //   return (
  //     this._httpClient
  //       //.post('https://server-dev.polybiusllc.com:4400/api/users/login', credentials)
  //       .post(`${environment.apiBaseUrl}/users/login`, credentials)
  //       .pipe(
  //         switchMap((res: any) => {
  //           console.log('signIn response:', res);
  //           this._authenticated = true;

  //           this._userSessionService.loadUserSession(res.session_id).subscribe({
  //             next: (session) => console.log('session loaded:', session),
  //             error: (err) => console.error('session load failed:', err),
  //           });

  //           this._socketService
  //             .socketConnect(res.session_id)
  //             .then((socketID) => {
  //               console.log('Connected, socketID:', socketID);
  //               this._userSessionService.updateUserSession({ socket_id: socketID });
  //             })
  //             .catch((err) => console.error('Socket connect failed:', err));

  //           return of(res);
  //         })
  //       )
  //   );
  // }

  // signIn(credentials: { username: string; password: string }): Observable<any> {
  //     console.log('signing in...');
  //     if (this._authenticated) return throwError(() => new Error('Already logged in'));

  //     return this._httpClient
  //       .post('https://server-dev.polybiusllc.com:4400/api/users/login', credentials, { withCredentials: true })
  //       .pipe(
  //         switchMap((res: any) => {
  //           console.log('user authenticated:', res);
  //           this._authenticated = true;
  //           this._userService.currentUser = res.user;

  //           if (res.user.sipData) {
  //             const config: SipConfig = {
  //               uri: `sip:${res.user.sipData.extension}@${res.user.sipData.sip_server}`,
  //               ws_servers: `wss://${res.user.sipData.sip_server}:8089/ws`,
  //               authorizationUser: res.user.sipData.extension,
  //               password: res.user.sipData.sip_password,
  //             };
  //             this._sipService.connect(config);
  //           }

  //        // Register socket (returns a Promise) and then initialize listeners
  //         return from(this._socketService.socketRegister(res.user)).pipe(
  //           tap(() => {
  //             // ✅ Initialize CallDataService listeners after socket is registered
  //             this._callDataService.initializeListeners();
  //           }),
  //           map(() => res.user) // return user for downstream subscription
  //         );
  //         })
  //       );
  // }

  /** Logout: server clears cookie */
  signOut(): Observable<any> {
    return this._httpClient
      .post(`${environment.apiBaseUrl}/users/logout`, {}, { withCredentials: true })
      .pipe(
        switchMap(() => {
          this._authenticated = false;
          this._userService.currentUser = null;
          //this._socketService.socketDeregister();
          return of(true);
        })
      );
  }

  /** Get current user */
  // getCurrentUser(): Observable<any> {
  //   console.log('checking for logged in user...');

  //   return this._httpClient
  //     .get('https://server-dev.polybiusllc.com:4400/api/users/me', { withCredentials: true })
  //     .pipe(
  //       switchMap((res: any) => {
  //         console.log('/me response:', res);
  //         if (res.user) {
  //           console.log('user logged in, returning token...');
  //           this._authenticated = true;
  //           this._userService.currentUser = res.user;
  //           this._currentUser = res.user;

  //           if (res.user.sipData) {
  //             const config: SipConfig = {
  //               uri: `sip:${res.user.sipData.extension}@${res.user.sipData.sip_server}`,
  //               ws_servers: `wss://${res.user.sipData.sip_server}:8089/ws`,
  //               authorizationUser: res.user.sipData.extension,
  //               password: res.user.sipData.sip_password,
  //             };
  //             this._sipService.connect(config);
  //           }

  //        // Register socket (returns a Promise) and then initialize listeners
  //         return from(this._socketService.socketRegister(res.user)).pipe(
  //           tap(() => {
  //             // ✅ Initialize CallDataService listeners after socket is registered
  //             this._callDataService.initializeListeners();
  //           }),
  //           map(() => res.user) // return user for downstream subscription
  //         );

  //         } else {
  //           console.log('user is not already logged in');
  //           this._authenticated = false;
  //           this._userService.currentUser = null;
  //           this._currentUser = null;
  //           return of(null);
  //         }
  //       }),
  //       catchError((err) => {
  //         console.log('/me error:', err.status);
  //         this._authenticated = false;
  //         this._userService.currentUser = null;
  //         this._currentUser = null;
  //         return of(null); // <--- important
  //       })
  //     );
  // }

  // auth.service.ts

  // getCurrentUser(): Observable<any> {
  //   if (this._currentUser) return of(this._currentUser);
  //   console.log('getting current user...');
  //   return this._httpClient
  //     .get(`${environment.apiBaseUrl}/users/me`, { withCredentials: true })
  //     .pipe(
  //       switchMap((res: any) => {
  //         if (res.user) {
  //           this._authenticated = true;
  //           this._userService.currentUser = res.user;
  //           this._currentUser = res.user;
  //           return of(res.user);
  //         } else {
  //           this._authenticated = false;
  //           this._userService.currentUser = null;
  //           return of(null);
  //         }
  //       })
  //     );
  // }

  getCurrentUser(): Observable<any> {
    if (this._currentUser) return of(this._currentUser);
    console.log('getting current user...');
    return this._httpClient
      .get(`${environment.apiBaseUrl}/users/me`, { withCredentials: true })
      .pipe(
        switchMap((res: any) => {
          if (res.user) {
            const normalizedUser = this.normalizeUserResponse(res);
            this._authenticated = true;
            this._userService.currentUser = normalizedUser;
            this._currentUser.next(normalizedUser);
            return of(normalizedUser);
          } else {
            this._authenticated = false;
            this._userService.currentUser = null;
            return of(null);
          }
        })
      );
  }

  // checkSession(): Observable<UserSession | null> {
  //   return this._userSessionService.userSession$.pipe(
  //     take(1), // get the current value once
  //     switchMap((session) => {
  //       if (session) {
  //         // session is already loaded locally
  //         return of(session);
  //       } else {
  //         // fetch session from backend (/me)
  //         return this._httpClient.get<UserSession>(`${environment.apiBaseUrl}/users/me`, {
  //           withCredentials: true
  //         }).pipe(
  //           tap((me) => this._userSessionService.userSession = me),
  //           catchError((err) => {
  //             console.error('Failed to fetch session from backend:', err);
  //             // optionally redirect to login
  //             this._router.navigateByUrl('/login');
  //             return of(null);
  //           })
  //         );
  //       }
  //     })
  //   );
  // }

  checkSession(): Observable<CurrentUser | null> {
    // If already checking or recently cached, reuse it
    if (this._meRequest$) {
      console.log('[AuthService] Reusing cached session observable', this._meRequest$);
      return this._meRequest$;
    }

    console.log('[AuthService] Performing /me check...');

    this._meRequest$ = this._httpClient
      .get<UserSession>(`${environment.apiBaseUrl}/users/me`, {
        withCredentials: true,
      })
      .pipe(
        switchMap((userSession) => {
          if (!userSession) {
            console.log('[AuthService] No user returned from /me');
            this._authenticated = false;
            this._userService.currentUser = null;
            this._meRequest$ = undefined; // reset so next time it re-checks
            return of(null);
          }
          console.log('check session current user:', userSession);
          //const normalizedUser = this.normalizeUserResponse(currentUser);
          //console.log('[AuthService] Session restored:', normalizedUser);
          this._authenticated = true;
          //this._userService.currentUser = normalizedUser;
          //this._currentUser.next(normalizedUser);
          //console.log('meRequest$', currentUser);
          // Return the user directly, without SIP or socket setup
          return of(userSession);
        }),
        catchError((err) => {
          console.warn('[AuthService] /me failed:', err.status);
          this._authenticated = false;
          this._userService.currentUser = null;
          this._meRequest$ = undefined; // reset for next check
          return of(null);
        }),
        shareReplay(1)
      );

    return this._meRequest$;
  }
}
