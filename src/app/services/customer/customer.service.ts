import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, switchMap, take } from 'rxjs/operators';
import { Customer } from './customer.types';
import { environment } from '../../../environments/environment';
//import { User } from '../user/user.types';
//import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private _customer: BehaviorSubject<Customer | null> =
    new BehaviorSubject<Customer | null>(null);
  private _customers: BehaviorSubject<Customer[] | null> = new BehaviorSubject<
    Customer[] | null
  >(null);

  baseURL: string = '/customers';

  constructor(private _httpClient: HttpClient) {}

  // --------------------------------------------------------------------------
  // Accessors
  // --------------------------------------------------------------------------
  set customer(value: Customer) {
    this._customer.next(value);
  }

  get customer$(): Observable<Customer | null> {
    return this._customer.asObservable();
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  // getAllCustomers(): Observable<Customer[]> {
  //   return this._httpClient.get<Customer[]>(`${this.baseURL}/getAllCustomers`).pipe(
  //     tap((customers) => console.log('Fetched customers:', customers)),
  //     map((customers) => customers || [])
  //   );
  // }

  getCustomerById(id: string): Observable<Customer> {
    return this._customers.pipe(
      take(1),
      map(
        (customers) =>
          (customers ?? []).find((customer) => customer.id === id) ?? null
      ),
      switchMap((customer) => {
        if (!customer)
          return throwError(
            () => new Error(`Could not find user with id ${id}!`)
          );
        this._customer.next(customer);
        return of(customer);
      })
    );
  }

  getCustomers(
    page: number,
    size: number,
    activeFilter?: 'all' | 'true' | 'false'
  ): Observable<{ data: Customer[]; total: number }> {
    let url = `${environment.apiBaseUrl}/customers/getCustomers?page=${page}&size=${size}`;

    if (activeFilter && activeFilter !== 'all') {
      url += `&active=${activeFilter}`; // send 'true' or 'false' as string
    }

    return this._httpClient.get<{ data: Customer[]; total: number }>(url);
  }

  createCustomer(data: any): Observable<Customer> {
    console.log('Creating customer with data:', data);

    return this._httpClient
      .post<Customer>(`${environment.apiBaseUrl}/customers/createNewCustomer`, data)
      .pipe(
        catchError((err) =>
          throwError(() => err.error?.message || 'Failed to create customer')
        )
      );
  }

  updateCustomer(payload: any): Observable<Customer> {
    return this._httpClient
      .post<Customer>(`${environment.apiBaseUrl}/customers/updateCustomer`, payload)
      .pipe(
        catchError((error) => {
          console.error('Update customer error:', error);

          let messages: string[] = [];
          if (error.error && Array.isArray(error.error)) {
            messages = error.error;
          } else if (error.error && error.error.error) {
            messages = Array.isArray(error.error.error)
              ? error.error.error
              : [error.error.error];
          } else {
            messages = ['An unexpected error occurred.'];
          }

          return throwError(() => messages);
        })
      );
  }
}

// uploadAvatar(file: File): Observable<{ filename: string }> {
//   const formData = new FormData();
//   formData.append('avatar', file);
//   return this._httpClient.post<{ filename: string }>(
//     `${this.baseURL}/upload-avatar`,
//     formData
//   );
// }
