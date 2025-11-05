import { Routes } from '@angular/router';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./customers.component').then(m => m.CustomersComponent),
    data: {
      title: 'Customers'
    }
  }
];

