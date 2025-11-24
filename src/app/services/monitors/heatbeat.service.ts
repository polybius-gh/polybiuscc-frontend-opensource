import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timer, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserSessionService } from '../userSession/user_session.service';

@Injectable({ providedIn: 'root' })
export class HeartbeatService {
  private heartbeatSub: Subscription | null = null;

  constructor(private http: HttpClient, private userSessionService: UserSessionService) {
    // Reactively watch the user observable
    this.userSessionService.userSession$.subscribe(userSession => {
      if (userSession && !this.heartbeatSub) {
        console.log('Starting heartbeat service');
        this.start();
      } else if (!userSession && this.heartbeatSub) {
        console.log('Stopping heartbeat service');
        this.stop();
      }
    });
  }

  private sendHeartbeat() {
    return this.http.get('/api/users/heartbeat', { withCredentials: true });
  }

  start() {
    if (this.heartbeatSub) return; // already running

    // Emit immediately, then every 3 minutes
    this.heartbeatSub = timer(0, 3 * 60 * 1000)
      .pipe(
        switchMap(() => this.sendHeartbeat())
      )
      .subscribe({
        next: (res: any) => {
          console.log('Heartbeat response:', res);
          if (res.status !== 'ok') {
            console.warn('Session heartbeat issue:', res);
          }
        },
        error: (err) => {
          console.error('Heartbeat failed:', err);
        }
      });
  }

  stop() {
    if (this.heartbeatSub) {
      this.heartbeatSub.unsubscribe();
      this.heartbeatSub = null;
    }
  }
}
