import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  FormArray,
} from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { CustomerService } from '../../services/customer/customer.service';
import { Customer } from '../../services/customer/customer.types';
//import { CurrentUser } from '../../services/user/currentUser.types';
import { UserSessionService } from '../../services/userSession/user_session.service';
import { UserSession } from '../../services/userSession/user_session.types';
import { UserService } from '../../services/user/user.service';
import { CustomerDialogComponent } from './modal/customer-dialog.component';
import { MatCardModule } from '@angular/material/card';
import { Subscription, takeUntil, Subject } from 'rxjs';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinner,
    ReactiveFormsModule,
  ],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
})
export class CustomersComponent implements OnInit {
  displayedColumns: string[] = [
    'company_name',
    'primary_contact',
    'email_address',
    'status',
    'actions',
  ];
  customers: Customer[] = [];
  loading = false;

  page = 1;
  pageSize = 10;
  total = 0;
  errorMessage: string = '';
  //sipExtensions: any[] = [];
  //selectedSipExtension: { [userId: string]: string } = {};
  cancelTargetId: string | null = null;
  showCancelModal: boolean = false;

  pageSizeControl!: FormControl;
  Math = Math; // Expose Math to template
  //_currentUser: CurrentUser | null = null;
  private _userSession: UserSession | null = null;
  _userSub?: Subscription;

  activeFilter: 'all' | 'true' | 'false' = 'all';
  filteredCustomers: any[] = [];
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    public _userService: UserService,
    public _userSessionService: UserSessionService,
    private _customerService: CustomerService,
    private _dialog: MatDialog,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    //super();
  }
  ngOnInit(): void {
    this.pageSizeControl = new FormControl(10);

    this.pageSizeControl.valueChanges.subscribe((size: number) => this.pageSizeChanged(size));

    this.loadCustomers();

    // this._userSub = this._userService.currentUser$.subscribe((currentUser) => {
    //   this._currentUser = currentUser;
    //   // you can now access this.currentUser in your component
    //   console.log('Current user:', this._currentUser);
    // });

    this._userSessionService.userSession$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((userSession: UserSession | null) => {
        this._userSession = userSession;
        // Mark for check
        this._changeDetectorRef.markForCheck();
        console.log('header userSession:', this._userSession);
      });
  }

  loadCustomers(): void {
    this.loading = true;
    this._customerService.getCustomers(this.page, this.pageSize, this.activeFilter).subscribe({
      next: (res: any) => {
        console.log('customer response:', res);
        this.customers = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  getPrimaryContact(customer: Customer): string {
    const c = customer.contacts?.[0];
    return c ? `${c.first_name} ${c.last_name}` : '—';
  }

  openDetails(customer?: Customer): void {
    const dialogRef = this._dialog.open(CustomerDialogComponent, {
      width: '80vw', // 80% of viewport width
      height: '80vh', // 80% of viewport height
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'customer-dialog',
      data: customer ? { customer } : { isNew: true },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((refresh) => {
      if (refresh) this.loadCustomers();
    });
  }

  pageChanged(newPage: number): void {
    this.page = newPage;
    this.loadCustomers();
  }

  pageSizeChanged(newSize: number): void {
    this.pageSize = newSize;
    this.page = 1;
    this.loadCustomers();
  }

  applyFilter() {
    console.log('customers being filtered', this.customers);
    if (this.activeFilter === 'all') {
      this.filteredCustomers = [...this.customers];
    } else {
      console.log('filtering:', this.activeFilter);
      const isActive = this.activeFilter === 'true';
      this.filteredCustomers = this.customers.filter((u) => Boolean(u.status) === isActive);
    }
  }

  addNewCustomer() {
    console.log('add new customer stuff here...');
  }
}
