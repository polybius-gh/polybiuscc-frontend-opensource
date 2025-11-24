import { Routes } from '@angular/router';
import { AuthGuard } from './services/guards/auth.guard';
import { NoAuthGuard } from './services/guards/noAuth.guard';
//import { AdminGuard } from './services/guards/admin.guard';
import { RoleGuard } from './services/guards/role.guard';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login-page/login-page').then((m) => m.LoginPage),
    canActivate: [NoAuthGuard],
  },
  {
    path: '',
    component: MainLayout, // Eager or lazy, just once
    canActivate: [AuthGuard], // Base guard for all authenticated areas
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./views/dashboard/routes').then((m) => m.routes),
        // canActivate: [RoleGuard],
        // data: { roles: ['agent', 'admin'] },
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('./views/customers/routes').then((m) => m.routes),
        // canActivate: [RoleGuard],
        // data: { roles: ['agent', 'admin'] },
      },
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        children: [
          {
            path: 'users',
            loadChildren: () =>
              import('./views/admin/users/routes').then((m) => m.routes),
          },
          {
            path: 'system-variables',
            loadChildren: () =>
              import('./views/admin/system-variables/routes').then(
                (m) => m.routes
              ),
          },
        ],
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];


// export const routes: Routes = [
//   {
//     path: 'login',
//     loadComponent: () => import('./pages/login/login-page/login-page').then((m) => m.LoginPage),
//     canActivate: [NoAuthGuard],
//   },
//   {
//     path: 'admin',
//     canActivate: [RoleGuard],
//     data: { roles: ['Admin'] },
//     loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
//     children: [
//       {
//         path: 'users',
//         loadChildren: () => import('./views/admin/users/routes').then((m) => m.routes),
//       },
//             {
//         path: 'system-variables',
//         loadChildren: () => import('./views/admin/system-variables/routes').then((m) => m.routes),
//       },
//     ],
//   },
//   {
//     path: '',
//     canActivate: [RoleGuard],
//     data: { roles: ['Agent', 'Admin'] },
//     loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
//     children: [
//       {
//         path: 'dashboard',
//         loadChildren: () => import('./views/dashboard/routes').then((m) => m.routes),
//       },
//       {
//         path: 'customers',
//         loadChildren: () => import('./views/customers/routes').then((m) => m.routes),
//       },

//       {
//         path: '',
//         pathMatch: 'full',
//         redirectTo: 'dashboard', // optional default child route
//       },
//     ],
//   },
//   {
//     path: '**',
//     redirectTo: 'login', // fallback route
//   },
// ];
