//header.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
//import { MatSidenav } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { CurrentUser } from '../../services/user/currentUser.type';
import { UserService } from '../../services/user/user.service';
import { AuthService } from '../../services/auth/auth.service';
import { SipService } from '../../services/jssip/jssip.service';
import { PhoneUIService } from '../../services/phoneui/phone_ui.service';
import { UserSessionService } from '../../services/userSession/user_session.service';
import { UserSession } from '../../services/userSession/user_session.type';
import { SipConfig } from '../../services/jssip/jssip.service';
import { SystemVariablesService } from '../../services/system-variables/system-variables.service';
//import { UserDialogComponent } from '../../views/admin/users/modal/user-dialog.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Input() sidenavToggle!: () => void; // <-- accept a function now

  public _currentUser: CurrentUser | null = null;
  public _userSession: UserSession | null = null;
  public phoneStatus: string = 'disconnected';
  public isRinging: boolean = false; // New property to track ringing state
  incomingCall: any = null;
  answeredCall: boolean = false;
  resourceURL: string = 'https://polybiuscc-resources.polybiusllc.com/avatars/';

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  userStatuses: string[] = [];

  public showPausedMessage = true;
  public currentTime: string = '';
  private _timeInterval: any;
  public selectedStatus: string = 'signedIn';
  public callDuration: string = '0:00';
  public importantMessage: string = 'System maintenance scheduled for 10:00 PM tonight.';

  colorModes = [
    { name: 'light', text: 'Light Mode', icon: 'light_mode' },
    { name: 'dark', text: 'Dark Mode', icon: 'dark_mode' },
  ];

  // current mode getter
  currentMode(): string {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  setColorMode(mode: string) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('color-mode', mode);
  }

  // Track call state and statuses
  public inCall: boolean = false;
  //  public selectedStatus: string = 'signedIn';
  public agentStatuses: string[] = ['Available', 'Busy', 'Wrap-up', 'Break'];

  public elapsedSeconds: number = 0;
  private _elapsedInterval: any;

  constructor(
    private _authService: AuthService,
    public _userService: UserService,
    public _userSessionService: UserSessionService,
    private _sipService: SipService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _phoneUI: PhoneUIService,
    private _systemVariablesService: SystemVariablesService
  ) {
    //super();
  }

  ngOnInit(): void {
    // Load all user statuses from backend
    this._systemVariablesService.getAll('user_status').subscribe({
      next: (statuses) => {
        // Extract just the names (e.g., 'InCall', 'Break', 'Meeting')
        this.userStatuses = statuses.map((s) => s.name);
      },
      error: (err) => console.error('Failed to load user statuses:', err),
    });

    //check for saved color mode
    const saved = localStorage.getItem('color-mode');
    if (saved) this.setColorMode(saved);

    //subscribe to userSession
    this._userSessionService.userSession$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((userSession: UserSession | null) => {
        this._userSession = userSession;
        // Mark for check
        this._changeDetectorRef.markForCheck();
        //console.log('header userSession:', this._userSession);
        if (this._userSession?.session_status === 'signedIn') {
          this.startElapsedTimer();
        } else {
          this.stopElapsedTimer();
        }
      });

    this._sipService.incomingCall$.subscribe((session) => {
      if (session) {
        this.incomingCall = session;
        this.isRinging = true;

        const clearRinging = () => {
          this.isRinging = false;
          session.off('ended', clearRinging);
          session.off('failed', clearRinging);
        };
        session.on('ended', clearRinging);
        session.on('failed', clearRinging);
      }
    });

    //connect to SIP server
    this._sipService.connect(this._userSession);

    //subscribe to current sip status
    this._sipService.status$.subscribe((status) => {
      this.phoneStatus = status;
      this.inCall = status === 'inCall' || status === 'newRTCSession';
      this._changeDetectorRef.markForCheck();
    });

    // Track incoming calls
    this._sipService.incomingCall$.subscribe((session) => {
      if (session) {
        this.incomingCall = session;
        // Set ringing state
        this.isRinging = true;
        const clearRinging = () => {
          this.isRinging = false;
          session.off('ended', clearRinging);
          session.off('failed', clearRinging);
        };
        session.on('ended', clearRinging);
        session.on('failed', clearRinging);
      }
    });

    // Start live time updates
    //this.updateTime();
    //this._timeInterval = setInterval(() => this.updateTime(), 1000);
  }

  get elapsedTime(): string {
    const minutes = Math.floor(this.elapsedSeconds / 60);
    const seconds = this.elapsedSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  startElapsedTimer(): void {
    this.stopElapsedTimer(); // clear any existing interval
    this.elapsedSeconds = 0;
    this._elapsedInterval = setInterval(() => {
      this.elapsedSeconds++;
      this._changeDetectorRef.markForCheck();
    }, 1000);
  }

  stopElapsedTimer(): void {
    if (this._elapsedInterval) {
      clearInterval(this._elapsedInterval);
      this._elapsedInterval = null;
    }
  }

  // Example: open dialpad modal (reuse your phone component or service)
  openDialpad(): void {
    //console.log('Open dialpad clicked');
    this._phoneUI.openDialpad();
    // Option 1: Trigger modal in PhoneService
    // this._sipService.openDialpadModal();
    // Option 2: Use Angular Material/Bootstrap modal service
  }

  // Example: change agent presence/status
  // setAgentStatus(status: string): void {
  //   this.selectedStatus = status;
  //   const sessionID = this._userSession?.id;

  //   if (!sessionID) {
  //     console.error('No active user session found');
  //     return;
  //   }

  //   console.log('Agent status set to:', status);

  //   this._userSessionService.changeStatus(sessionID, status).subscribe({
  //     next: (res) => {
  //       console.log('Session status updated successfully:', res);
  //       // Optionally refresh session info or emit socket event
  //     },
  //     error: (err) => console.error('Error updating session status:', err),
  //   });
  // }

  // Example: hangup current call
  hangupCall(): void {
    //console.log('Hanging up call...');
    this._sipService.hangup();
    this.answeredCall = false;
  }

  // Example: initiate transfer
  transferCall(): void {
    //console.log('Transfer call...');
    //this._sipService.transferCallPrompt(); // Or open a dialog to pick destination
    this.answeredCall = false;
  }

  //answer call
  // answerCall() {
  //   if (this.incomingCall) {
  //     this.answeredCall = true;
  //     this._sipService.answer(this.incomingCall);
  //     this.incomingCall = null;
  //   }
  // }
  // Answering call
  answerCall() {
    if (this.incomingCall) {
      this.answeredCall = true;
      this._sipService.answer(this.incomingCall);
      this.incomingCall = null;
      this.isRinging = false;
    }
  }
  updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this._changeDetectorRef.markForCheck();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
    if (this._timeInterval) clearInterval(this._timeInterval);
  }

  // Modify your existing setAgentStatus:
  setAgentStatus(status: string): void {
    this.selectedStatus = status;
    const sessionID = this._userSession?.id;

    if (!sessionID) {
      console.error('No active user session found');
      return;
    }

    //console.log('Agent status set to:', status);

    this._userSessionService.changeStatus(sessionID, status).subscribe({
      next: (res) => {
        // Remove paused message after first manual status change
        if (this.showPausedMessage) {
          this.showPausedMessage = false;
          this._changeDetectorRef.markForCheck();
        }
      },
      error: (err) => console.error('Error updating session status:', err),
    });
  }

  getPhoneIconClass(): string {
    if (this.isRinging) {
      return 'text-warning blink'; // blink while ringing
    }

    switch (this.phoneStatus) {
      case 'connected':
      case 'registered':
        return 'text-success'; // green

      case 'newRTCSession':
        return 'text-warning blink'; // yellow/orange (ringing or active call)

      case 'disconnected':
      case 'registrationFailed':
        return 'text-danger'; // red

      case 'idle':
      default:
        return 'text-secondary'; // gray
    }
  }

  getPhoneIconName(): string {
    return this.phoneStatus === 'newRTCSession' ? 'phone_enabled' : 'phone_disabled';
  }

  sidebarId = Input('sidebar1');

  signOut(): void {
    //console.log('signing out');
    this._authService.signOut().subscribe(() => {
      //console.log('signed out');
      window.location.reload();
    });
  }
}
