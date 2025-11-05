import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { SocketIoConfig, provideSocketIo } from 'ngx-socket-io';
import { JwtModule } from '@auth0/angular-jwt';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';

const socketConfig: SocketIoConfig = { 
    url: 'https://server-dev.polybiusllc.com:4400', 
    options: {
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 10000,
        reconnectionAttempts: 10,
    }
};

export const appConfig: ApplicationConfig = {
  providers: [
    BrowserModule,
    provideAnimations(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideSocketIo(socketConfig),
      provideHttpClient(),
    importProvidersFrom(
      JwtModule.forRoot({ 
        config: {
          tokenGetter: () => sessionStorage.getItem('accessToken') || '',
          allowedDomains: ['server-dev.polybiusllc.com:4400'],
          disallowedRoutes: []
        }
      }),
      ReactiveFormsModule,
    )
  ]
};
