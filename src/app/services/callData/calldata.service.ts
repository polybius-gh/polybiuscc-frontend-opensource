import { Injectable } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { Socket } from "ngx-socket-io";

@Injectable({ providedIn: 'root' })
export class CallDataService {
  private listenersInitialized = false;
  private subscriptions: Subscription[] = [];

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
      this._socket.fromEvent('sendCallCount').subscribe(data => this.updateCallCount(data))
    );

    this.subscriptions.push(
      this._socket.fromEvent('sendTeamData').subscribe(data => this.updateTeamData(data))
    );

  }

  teardownListeners() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    this.listenersInitialized = false;
  }

  callCount$ = new BehaviorSubject<number>(0);

  private updateCallCount(data: any) {
    this.callCount$.next(data);
    console.log('callCount:', this.callCount$);
  }

  private updateTeamData(data: any) {
    console.log('Team data received:', data);
  }
}
