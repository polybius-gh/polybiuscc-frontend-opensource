import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { CurrentUser } from '../../services/user/currentUser.types';
import { UserService } from '../../services/user/user.service';
import { AuthService } from '../../services/auth/auth.service';
import { SipService } from '../../services/jssip/jssip.service';
import { PhoneUIService } from '../../services/phoneui/phone_ui.service';
import { UserSessionService } from '../../services/userSession/user_session.service';
import { UserSession } from '../../services/userSession/user_session.types';
import { SipConfig } from '../../services/jssip/jssip.service';

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

  //readonly #colorModeService = inject(ColorModeService);
  //readonly colorMode = this.#colorModeService.colorMode;

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
  public selectedStatus: string = 'Available';
  public agentStatuses: string[] = ['Available', 'Busy', 'Wrap-up', 'Break'];

  constructor(
    private _authService: AuthService,
    public _userService: UserService,
    public _userSessionService: UserSessionService,
    private _sipService: SipService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _phoneUI: PhoneUIService
  ) {
    //super();
  }

  ngOnInit(): void {
    //check for saved color mode
    const saved = localStorage.getItem('color-mode');
    if (saved) this.setColorMode(saved);

    // Subscribe to user changes
    // this._userService.currentUser$
    //   .pipe(takeUntil(this._unsubscribeAll))
    //   .subscribe((currentUser: CurrentUser | null) => {
    //     this._currentUser = currentUser;
    //     // Mark for check
    //     this._changeDetectorRef.markForCheck();
    //     console.log('header user:', this._currentUser);
    //   });

    //subscribe to userSession
    this._userSessionService.userSession$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((userSession: UserSession | null) => {
        this._userSession = userSession;
        // Mark for check
        this._changeDetectorRef.markForCheck();
        console.log('header userSession:', this._userSession);
      });

    const config: SipConfig = {
      uri: `sip:${this._userSession?.sip_extension}@${this._userSession?.sip_server}`,
      ws_servers: `wss://${this._userSession?.sip_server}:8089/ws`,
      authorizationUser: this._userSession?.sip_extension,
      password: this._userSession?.sip_password,
    };

    this._sipService.connect(config);

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
  }

  // Example: open dialpad modal (reuse your phone component or service)
  openDialpad(): void {
    console.log('Open dialpad clicked');
    this._phoneUI.openDialpad();
    // Option 1: Trigger modal in PhoneService
    // this._sipService.openDialpadModal();
    // Option 2: Use Angular Material/Bootstrap modal service
  }

  // Example: change agent presence/status
  setAgentStatus(status: string): void {
    this.selectedStatus = status;
    console.log('Agent status set to:', status);
    // Optional: send to backend presence API
    // this._userService.updateAgentStatus(status).subscribe(...)
  }

  // Example: hangup current call
  hangupCall(): void {
    console.log('Hanging up call...');
    this._sipService.hangup();
    this.answeredCall = false;
  }

  // Example: initiate transfer
  transferCall(): void {
    console.log('Transfer call...');
    //this._sipService.transferCallPrompt(); // Or open a dialog to pick destination
    this.answeredCall = false;
  }

  //answer call
  answerCall() {
    if (this.incomingCall) {
      this.answeredCall = true;
      this._sipService.answer(this.incomingCall);
      this.incomingCall = null;
    }
  }

  // setTestInterval(): void {
  //           // Simulate phone status changes for demonstration purposes
  //         setInterval(() => {
  //           const statuses: ('connected' | 'in-use' | 'idle' | 'disconnected')[] = ['connected', 'in-use', 'idle', 'disconnected'];
  //           this.phoneStatus = statuses[Math.floor(Math.random() * statuses.length)];
  //           this._changeDetectorRef.markForCheck();
  //         }, 10000);
  // }

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
    console.log('signing out');
    this._authService.signOut().subscribe(() => {
      console.log('signed out');
      window.location.reload();
    });
  }
}
