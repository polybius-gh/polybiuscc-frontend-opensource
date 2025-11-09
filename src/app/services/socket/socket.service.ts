import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
//import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
//import { UserService } from '../user/user.service';
import { Socket } from 'ngx-socket-io';
import { CallDataService } from '../callData/calldata.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private _socketRegistered: boolean = false;

  /**
   * Constructor
   */
  constructor(
    private _httpClient: HttpClient,
    //private _userService: UserService,
    private _callDataService: CallDataService,
    private _socket: Socket
  ) {
    _socket.on('connect',  () => {
      console.log('socket service connected:', _socket.id);
      //initializing listeners
      this._callDataService.initializeListeners();
    });

    this._socket.fromEvent('testping').subscribe((e) => {
      console.log('ping test received', e);
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  //connect to socket

socketConnect(sessionID: string): Promise<string> {
  this._socket.ioSocket.auth = { session_id: sessionID };

  return new Promise((resolve, reject) => {
    if (this._socket.connected && this._socket.id) {
      // Already connected and ID is defined
      resolve(this._socket.id);
    } else {
      this._socket.once('connect', () => {
        if (this._socket.id) {
          resolve(this._socket.id); // safe now
        } else {
          reject(new Error('Socket connected but ID is undefined'));
        }
      });

      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timed out'));
      }, 5000);

      this._socket.once('connect', () => clearTimeout(timeout));

      this._socket.connect();
    }
  });
}






//   socketConnect(sessionID: string) {
//     this._socket.ioSocket.auth = { session_id: sessionID }; // runtime
//     if (!this._socket.connected) {
//       this._socket.connect();
//     }
//   }

  /**
   * Register Socket Session
   *
   * @param userID
   */
  socketRegister(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('socket register data:', data);

      // Function to emit after connection
      const emitRegistry = () => {
        console.log('emitting registry');
        this._socket.emit('socketRegistry', data.session_id, (ack: any) => {
          // Optional: if server sends an ack
          console.log('Server acknowledged socket registry:', ack);
          this._socketRegistered = true;
          resolve(); // mark as complete
        });

        // If you don't use ack, just resolve immediately
        // this._socketRegistered = true;
        // resolve();
      };

      if (this._socket.connected) {
        console.log('i appear to be connected...');
        emitRegistry();
      } else {
        // Listen for connect event once
        this._socket.once('connect', () => {
          console.log('Socket connected', this._socket.id);
          emitRegistry();
        });

        this._socket.connect();

        // Optional: timeout in case connection fails
        setTimeout(() => {
          if (!this._socket.connected) {
            reject(new Error('Socket connection timed out'));
            resolve();
          }
        }, 5000); // 5 seconds
      }
    });
  }

  socketDeregister() {
    //send sign out notice to socket server and force disconnectx
    this._socket.emit('socketLogoff', this._socket.id);
    this._socket.disconnect();
    this._socketRegistered = false;
  }
}
