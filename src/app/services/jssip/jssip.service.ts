//jssip.service.ts

// import { Injectable, NgZone } from '@angular/core';
// import * as JsSIP from 'jssip';
// import { BehaviorSubject, ReplaySubject } from 'rxjs';
// import { UserSession } from '../userSession/user_session.type';
// import { SocketService } from '../socket/socket.service';

// export interface SipConfig {
//   uri: string;
//   ws_servers: string;
//   authorizationUser?: string;
//   password?: string;
//   display_name?: string;
//   [key: string]: any;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class SipService {
//   private ua!: JsSIP.UA;
//   private mediaElement!: HTMLAudioElement;
//   //private _userSession: UserSession | null = null;
//   public status$ = new BehaviorSubject<string>('disconnected');
//   public callStatus$ = new BehaviorSubject<string>('idle');
//   public incomingCall$ = new ReplaySubject<any>();
//   public activeSession$ = new BehaviorSubject<any | null>(null);

//   setMediaElement(el: HTMLAudioElement) {
//     this.mediaElement = el;
//   }

//   constructor(private ngZone: NgZone, private _socketService: SocketService) {}

//   /**
//    * Initializes and starts the JsSIP User Agent.
//    */
//   //connect(config: SipConfig, mediaElement: HTMLAudioElement) {
//   connect(userSession: UserSession | null) {
//     console.log('jssip userSession received:', userSession);

//     let _userSession = userSession;

//     const config: SipConfig = {
//       uri: `sip:${_userSession?.sip_extension}@${_userSession?.sip_server}`,
//       ws_servers: `wss://${_userSession?.sip_server}:8089/ws`,
//       authorizationUser: _userSession?.sip_extension,
//       password: _userSession?.sip_password,
//     };

//     //console.log('connecting to sip server:', config);
//     if (!this.mediaElement) {
//       console.error('Media element not set!');
//       return;
//     }

//     const socket = new JsSIP.WebSocketInterface(config.ws_servers);
//     this.ua = new JsSIP.UA({
//       ...config,
//       sockets: [socket],
//     });

//     // UA event handler
//     this.ua.on('connected', () => this.ngZone.run(() => this.status$.next('connected')));
//     this.ua.on('disconnected', () => this.ngZone.run(() => this.status$.next('disconnected')));
//     //this.ua.on('registered', () => this.ngZone.run(() => this.status$.next('registered')));
//     // inside this.ua.on('registered', ...) callback
//     this.ua.on('registered', () => {
//       this.ngZone.run(() => this.status$.next('registered'));
//       console.log('✅ SIP Registered, notifying backend...');

//       // emit socket event for agent login
//       const userSession = _userSession; // from your connect() param
//       this.emitAgentLogin(userSession);
//     });

//     this.ua.on('unregistered', () => this.ngZone.run(() => this.status$.next('unregistered')));
//     this.ua.on('registrationFailed', () =>
//       this.ngZone.run(() => this.status$.next('registrationFailed'))
//     );
//     this.ua.on('newRTCSession', () => this.ngZone.run(() => this.status$.next('newRTCSession')));
//     this.ua.on('newMessage', () => this.ngZone.run(() => this.status$.next('newMessage')));

//     // Handle new sessions (incoming and outgoing)
//     this.ua.on('newRTCSession', (data: any) => {
//       const session: any = data.session;
//       console.log('newRTCSession:', data);

//       // 1️⃣ Attach all important handlers immediately

//       const clearActiveSession = () => {
//         console.log('clearning active session');
//         this.ngZone.run(() => this.activeSession$.next(null));
//         this.ngZone.run(() => this.status$.next('registered'));
//         this.ngZone.run(() => this.callStatus$.next('idle'));
//       };

//       const STATUS_TERMINATED = (session as any).constructor.C.STATUS_TERMINATED;

//       session.on('ended', clearActiveSession);
//       session.on('failed', clearActiveSession);
//       session.on('closed', () => console.log('Session closed by remote end'));

//       // 2️⃣ Safety check in case session already terminated
//       if (session.status === STATUS_TERMINATED) {
//         console.log('Session terminated');
//         clearActiveSession();
//         return;
//       }

//       // Answered events
//       session.on('accepted', () => {
//         console.log('Call accepted (remote party answered)');
//         this.ngZone.run(() => this.callStatus$.next('live'));
//       });

//       if (data.originator === 'remote') {
//         this.ngZone.run(() => this.incomingCall$.next(session));
//         this.ngZone.run(() => this.activeSession$.next(session));
//         return; // Incoming call, do not set active session yet
//       }

//       this.ngZone.run(() => this.activeSession$.next(session));

//       // Attach stream listener immediately (works for in/out calls)
//       this.attachRemoteStream(session);
//     });

//     this.ua.start();
//   }

//   private emitAgentLogin(userSession: any) {
//   const payload = {
//     event: 'login',
//     user: {
//       session_id: userSession.id,
//       username: userSession.username,
//       extension: userSession.sip_extension,
//       security_level: userSession.security_level,
//       skill_groups: userSession.skill_groups || [],
//     },
//   };
//   this._socketService.emitUserSessionEvent(payload);
// }

//   /**
//    * Makes an outgoing call.
//    */
//   makeCall(target: string) {
//     if (!this.ua || !this.ua.isRegistered()) {
//       console.error('UA not registered.');
//       return;
//     }

//     const options: any = {
//       mediaConstraints: { audio: true, video: false },
//     };

//     this.ua.call(`sip:${target}`, options);
//   }

//   /**
//    * Hangs up the active call.
//    */
//   hangup() {
//     const session = this.activeSession$.getValue();
//     if (session) {
//       console.log('Hanging up call', session);
//       session.terminate();
//       // this.ngZone.run(() => this.activeSession$.next(null));
//       // this.ngZone.run(() => this.status$.next('registered'));
//     }
//   }

//   /**
//    * Answers an incoming call.
//    */
//   answer(session: any) {
//     console.log('Answering call', session);
//     const options = { mediaConstraints: { audio: true, video: false } };
//     session.answer(options);
//   }

//   /**
//    * Attach remote audio stream to HTML audio element
//    */
//   private attachRemoteStream(session: any) {
//     if (!this.mediaElement) {
//       console.warn('No mediaElement set to attach stream');
//       return;
//     }

//     console.log('Attaching remote stream', session);
//     session.connection.addEventListener('track', (e: any) => {
//       console.log('Received remote track', e);
//       if (this.mediaElement && e.track.kind === 'audio') {
//         if (this.mediaElement.srcObject !== e.streams[0]) {
//           this.mediaElement.srcObject = e.streams[0];
//           this.mediaElement.play().catch((err) => console.error('Media play failed', err));
//         } else {
//           console.log('Stream already attached to media element');
//         }
//       } else {
//         console.log('Received non-audio track or no media element available');
//       }
//     });
//   }
// }


import { Injectable, NgZone } from '@angular/core';
import * as JsSIP from 'jssip';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { UserSession } from '../userSession/user_session.type';
import { SocketService } from '../socket/socket.service';

export interface SipConfig {
  uri: string;
  ws_servers: string;
  authorizationUser?: string;
  password?: string;
  display_name?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class SipService {
  private ua!: JsSIP.UA;
  private mediaElement!: HTMLAudioElement;
  private ringtoneAudio!: HTMLAudioElement;

  public status$ = new BehaviorSubject<string>('disconnected');
  public callStatus$ = new BehaviorSubject<string>('idle');
  public incomingCall$ = new ReplaySubject<any>();
  public activeSession$ = new BehaviorSubject<any | null>(null);

  constructor(private ngZone: NgZone, private _socketService: SocketService) {}

  setMediaElement(el: HTMLAudioElement) {
    this.mediaElement = el;
  }

  initRingtone(src: string = 'assets/sounds/ringtone.mp3') {
    this.ringtoneAudio = new Audio(src);
    this.ringtoneAudio.loop = true;
    this.ringtoneAudio.volume = 0.8;
    this.ringtoneAudio.load();
  }

  private playRingtone() {
    try {
      if (!this.ringtoneAudio) this.initRingtone();
      this.ringtoneAudio.currentTime = 0;
      this.ringtoneAudio.play().catch(err => console.warn('Ringtone play blocked', err));
    } catch (err) {
      console.error('Error playing ringtone:', err);
    }
  }

  private stopRingtone() {
    try {
      if (this.ringtoneAudio) {
        this.ringtoneAudio.pause();
        this.ringtoneAudio.currentTime = 0;
      }
    } catch (err) {
      console.error('Error stopping ringtone:', err);
    }
  }

  connect(userSession: UserSession | null) {
    if (!userSession) return;
    console.log('jssip userSession received:', userSession);

    const config: SipConfig = {
      uri: `sip:${userSession.sip_extension}@${userSession.sip_server}`,
      ws_servers: `wss://${userSession.sip_server}:8089/ws`,
      authorizationUser: userSession.sip_extension,
      password: userSession.sip_password,
    };

    if (!this.mediaElement) {
      console.error('Media element not set!');
      return;
    }

    const socket = new JsSIP.WebSocketInterface(config.ws_servers);
    this.ua = new JsSIP.UA({ ...config, sockets: [socket] });

    this.ua.on('connected', () => this.ngZone.run(() => this.status$.next('connected')));
    this.ua.on('disconnected', () => this.ngZone.run(() => this.status$.next('disconnected')));
    this.ua.on('registered', () => {
      this.ngZone.run(() => this.status$.next('registered'));
      console.log('✅ SIP Registered, notifying backend...');
      this.emitAgentLogin(userSession);
    });
    this.ua.on('unregistered', () => this.ngZone.run(() => this.status$.next('unregistered')));
    this.ua.on('registrationFailed', () => this.ngZone.run(() => this.status$.next('registrationFailed')));
    this.ua.on('newRTCSession', () => this.ngZone.run(() => this.status$.next('newRTCSession')));
    this.ua.on('newMessage', () => this.ngZone.run(() => this.status$.next('newMessage')));

    this.ua.on('newRTCSession', (data: any) => {
      const session = data.session;
      console.log('newRTCSession:', data);

      const clearActiveSession = () => {
        console.log('clearing active session');
        this.ngZone.run(() => {
          this.activeSession$.next(null);
          this.status$.next('registered');
          this.callStatus$.next('idle');
        });
        this.stopRingtone();
      };

      const STATUS_TERMINATED = (session as any).constructor.C.STATUS_TERMINATED;
      session.on('ended', clearActiveSession);
      session.on('failed', clearActiveSession);
      session.on('closed', () => console.log('Session closed by remote end'));

      if (session.status === STATUS_TERMINATED) {
        clearActiveSession();
        return;
      }

      session.on('accepted', () => {
        console.log('Call accepted');
        this.ngZone.run(() => this.callStatus$.next('live'));
        this.stopRingtone();
      });

      if (data.originator === 'remote') {
        this.playRingtone();
        this.ngZone.run(() => {
          this.incomingCall$.next(session);
          this.activeSession$.next(session);
          this.callStatus$.next('ringing');
        });
        return;
      }

      this.ngZone.run(() => this.activeSession$.next(session));
      this.attachRemoteStream(session);
    });

    this.ua.start();
  }

  private emitAgentLogin(userSession: any) {
    const payload = {
      event: 'login',
      user: {
        session_id: userSession.id,
        username: userSession.username,
        extension: userSession.sip_extension,
        security_level: userSession.security_level,
        skill_groups: userSession.skill_groups || [],
      },
    };
    this._socketService.emitUserSessionEvent(payload);
  }

  makeCall(target: string) {
    if (!this.ua || !this.ua.isRegistered()) {
      console.error('UA not registered.');
      return;
    }
    this.ua.call(`sip:${target}`, { mediaConstraints: { audio: true, video: false } });
  }

  hangup() {
    const session = this.activeSession$.getValue();
    if (session) session.terminate();
  }

  answer(session: any) {
    session.answer({ mediaConstraints: { audio: true, video: false } });
  }

  private attachRemoteStream(session: any) {
    if (!this.mediaElement) return;
    session.connection.addEventListener('track', (e: any) => {
      if (e.track.kind === 'audio' && this.mediaElement.srcObject !== e.streams[0]) {
        this.mediaElement.srcObject = e.streams[0];
        this.mediaElement.play().catch(err => console.error('Media play failed', err));
      }
    });
  }
}
