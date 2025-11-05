import { Routes } from '@angular/router';
import { AuthGuard } from './services/guards/auth.guard';
import { NoAuthGuard } from './services/guards/noAuth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login-page/login-page').then((m) => m.LoginPage),
    canActivate: [NoAuthGuard],
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./views/dashboard/routes').then((m) => m.routes),
      },
      {
        path: 'customers',
        loadChildren: () => import('./views/customers/routes').then((m) => m.routes),
      },
      {
        path: 'users',
        loadChildren: () => import('./views/users/routes').then((m) => m.routes),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard', // optional default child route
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login', // fallback route
  },
];
