import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { SocketService } from './socket.service';
//import { AuthInterceptor } from 'app/core/auth/auth.interceptor';

@NgModule({
    imports  : [
        HttpClientModule
    ],
    providers: [
        SocketService,
    ]
})
export class SocketModule
{
}
