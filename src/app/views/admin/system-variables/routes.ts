import { Routes } from '@angular/router';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./system-variables').then(m => m.SystemVariables),
    data: {
      title: 'System Variables'
    }
  }
];

