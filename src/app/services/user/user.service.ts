import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, switchMap, take } from 'rxjs/operators';
import { User } from './user.types';
import { CurrentUser } from './currentUser.types';


@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _currentUser: BehaviorSubject<CurrentUser | null> = new BehaviorSubject<CurrentUser | null>(null);
  private _user: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private _users: BehaviorSubject<User[] | null> = new BehaviorSubject<User[] | null>(null);

  baseURL: string = '/api/users';

  constructor(private _httpClient: HttpClient) {}

  // --------------------------------------------------------------------------
  // Accessors
  // --------------------------------------------------------------------------
  set currentUser(value: CurrentUser | null) {
    this._currentUser.next(value);
  }

  get currentUser$(): Observable<CurrentUser | null> {
    return this._currentUser.asObservable();
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------
  get currentUser(): CurrentUser | null {
    return this._currentUser.getValue();
  }

  getAllUsers(): Observable<User[]> {
    return this._httpClient.get<User[]>(`${this.baseURL}/getAllUsers`).pipe(
      tap((users) => console.log('Fetched users:', users)),
      map((users) => users || [])
    );
  }

  getUserById(id: string): Observable<User> {
    return this._users.pipe(
      take(1),
      map((users) => (users ?? []).find((user) => user.id === id) ?? null),
      switchMap((user) => {
        if (!user) return throwError(() => new Error(`Could not find user with id ${id}!`));
        this._user.next(user);
        return of(user);
      })
    );
  }

  getUsers(
    page: number,
    size: number,
    activeFilter?: 'all' | 'true' | 'false'
  ): Observable<{ data: User[]; total: number }> {
    let url = `${this.baseURL}/getUsers?page=${page}&size=${size}`;

    if (activeFilter && activeFilter !== 'all') {
      url += `&active=${activeFilter}`; // send 'true' or 'false' as string
    }

    return this._httpClient.get<{ data: User[]; total: number }>(url);
  }

  createUser(data: any): Observable<User> {
    return this.currentUser$.pipe(
      take(1), // take the current value only
      switchMap((creatingUser) => {
        if (!creatingUser?.id) {
          return throwError(() => 'No current user ID found');
        }

        const payload = { ...data, currentUserId: creatingUser.id };

        return this._httpClient
          .post<User>(`${this.baseURL}/createNewUser`, payload)
          .pipe(
            catchError((err) => throwError(() => err.error?.message || 'Failed to create user'))
          );
      })
    );
  }

  updateUser(userId: string, data: any): Observable<User> {
    return this.currentUser$.pipe(
      take(1), // take the current user once
      switchMap((creatingUser) => {
        if (!creatingUser?.id) {
          return throwError(() => 'No current user ID found');
        }

        const payload = {
          ...data,
          id: userId,
          currentUserId: creatingUser.id,
        };

        return this._httpClient.post<User>(`${this.baseURL}/updateUser`, payload).pipe(
          catchError((error) => {
            console.error('Update user error:', error);

            let messages: string[] = [];
            if (error.error && Array.isArray(error.error)) {
              messages = error.error;
            } else if (error.error && error.error.error) {
              messages = Array.isArray(error.error.error) ? error.error.error : [error.error.error];
            } else {
              messages = ['An unexpected error occurred.'];
            }

            return throwError(() => messages);
          })
        );
      })
    );
  }

  assignSipExtension(userId: string): Observable<User> {
    return this._httpClient.post<User>(`${this.baseURL}/assignSipExtension`, { userId });
  }

  loadAvailableSipExtensions(): Observable<any[]> {
    return this._httpClient.get<any[]>(`${this.baseURL}/getAllAvailableSipExtensions`);
  }

  uploadAvatar(file: File): Observable<{ filename: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this._httpClient.post<{ filename: string }>(`${this.baseURL}/upload-avatar`, formData);
  }

  /**
   * Toggle a user's active status.
   * @param userId - ID of the user to update
   * @param newActiveValue - new boolean active status
   */
  toggleUserActive(input: any): Observable<User> {
    return this.currentUser$.pipe(
      take(1), // take the current user once
      switchMap((creatingUser) => {
        if (!creatingUser?.id) {
          return throwError(() => 'No current user ID found');
        }

        const payload = { ...input, currentUserId: creatingUser.id };

        return this._httpClient.post<User>(`${this.baseURL}/updateUserActive`, payload).pipe(
          catchError((err) => {
            console.error('Toggle active error:', err);
            return throwError(() => err.error?.message || 'Failed to toggle active status');
          })
        );
      })
    );
  }

    /**
   * Update one or more properties of the current user safely.
   * Example: this.userService.updateCurrentUser({ socket_id: 'abc123' });
   */
  updateCurrentUser(partial: Partial<CurrentUser>): void {
    const current = this._currentUser.value;
    if (current) {
      const updated = { ...current, ...partial };
      this._currentUser.next(updated);
    } else {
      console.warn('Tried to update user before currentUser was set.');
    }
  }
}
