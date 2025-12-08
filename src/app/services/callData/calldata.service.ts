import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Socket } from 'ngx-socket-io';

@Injectable({ providedIn: 'root' })
export class CallDataService {
  private listenersInitialized = false;
  private subscriptions: Subscription[] = [];

  callCount$ = new BehaviorSubject<number>(0);
  liveUserCount$ = new BehaviorSubject<number>(0);

  constructor(private _socket: Socket) {
    // Auto teardown on socket disconnect
    this._socket.on('disconnect', () => {
      console.log('Socket disconnected, cleaning up listeners...');
      this.teardownListeners();
    });
  }

  initializeListeners() {
    if (this.listenersInitialized) return;
    this.listenersInitialized = true;

    console.log('Initializing CallDataService listeners...');

    this.subscriptions.push(
      this._socket.fromEvent('sendCallCount').subscribe((data) => this.updateCallCount(data))
    );

    this.subscriptions.push(
      this._socket
        .fromEvent('sendLiveUserCount')
        .subscribe((data) => this.updateLiveUserCount(data))
    );
  }

  teardownListeners() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    this.listenersInitialized = false;
  }

  // private updateCallCount(data: any) {
  //   this.callCount$.next(data);
  //   console.log('callCount:', this.callCount$);
  // }

  private updateCallCount(data: any) {
    //console.log('Call count data received:', data);
    // data is an array of live calls
    const count = Array.isArray(data) ? data.length : 0;

    // Push the count to the observable
    this.callCount$.next(count);

    console.log('Live call count:', count);
  }

  private updateLiveUserCount(data: any) {
    //console.log('Live user data received:', data);
    // data is an array of live calls
    const count = Array.isArray(data) ? data.length : 0;
    this.liveUserCount$.next(count);
    //console.log('User Count received:', data);
  }
}
