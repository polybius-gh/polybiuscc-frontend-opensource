import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { Sidebar } from '../sidebar/sidebar';
import { UserSessionService } from '../../services/userSession/user_session.service';
import { UserSession } from '../../services/userSession/user_session.type';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    RouterOutlet,
    Header,
    Footer,
    Sidebar,
    //BrowserAnimationsModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  animations: [
    trigger('sidebarSlide', [
      state(
        'open',
        style({
          transform: 'translateX(0)',
        })
      ),
      state(
        'closed',
        style({
          transform: 'translateX(-100%)',
        })
      ),
      transition('open <=> closed', [animate('300ms ease-in-out')]),
    ]),
  ],
})

export class MainLayout implements OnInit, OnDestroy {
  isSidebarClosed = false;
  _userSession: UserSession | null = null;

    // Elapsed session timer
  elapsedSeconds = 0;
  private _elapsedInterval: any;

  // Current clock
  clockTime: string = '';
  private _clockInterval: any;

  private _unsubscribeAll: Subject<any> = new Subject();

   constructor(private _userSessionService: UserSessionService, private _cdr: ChangeDetectorRef) {}

     ngOnInit(): void {
    // Subscribe to user session
    this._userSessionService.userSession$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((session) => {
        this._userSession = session;
        this._cdr.markForCheck();

        if (session?.session_status === 'signedIn') {
          this.startElapsedTimer();
        } else {
          this.stopElapsedTimer();
        }
      });

    // Start clock
    this.updateClock();
    this._clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
    this.stopElapsedTimer();
    if (this._clockInterval) clearInterval(this._clockInterval);
  }

  updateClock(): void {
    const now = new Date();
    this.clockTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  startElapsedTimer(): void {
    this.stopElapsedTimer();
    this.elapsedSeconds = 0;
    this._elapsedInterval = setInterval(() => {
      this.elapsedSeconds++;
    }, 1000);
  }

  stopElapsedTimer(): void {
    if (this._elapsedInterval) {
      clearInterval(this._elapsedInterval);
      this._elapsedInterval = null;
    }
  }

  get elapsedTime(): string {
    const minutes = Math.floor(this.elapsedSeconds / 60);
    const seconds = this.elapsedSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  toggleSidebar = () => {
    this.isSidebarClosed = !this.isSidebarClosed;
  };
}
