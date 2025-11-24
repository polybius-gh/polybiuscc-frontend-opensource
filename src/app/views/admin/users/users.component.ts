import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatCard, MatCardModule } from '@angular/material/card';
import { User } from '../../../services/user/user.type';
//import { CurrentUser } from '../../../services/user/currentUser.type';
import { UserService } from '../../../services/user/user.service';
import { UserSessionService } from '../../../services/userSession/user_session.service';
import { UserSession } from '../../../services/userSession/user_session.type';
import { UserDialogComponent } from './modal/user-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatOptionModule,
    MatDialogModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatCardModule,
  ],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  expandedRows: Set<string> = new Set();
  //editForms: { [key: string]: FormGroup } = {};

  resourceURL: string = 'https://polybiuscc-resources.polybiusllc.com/avatars/';
  page = 1;
  pageSize = 10;
  total = 0;
  errorMessage: string = '';
  sipExtensions: any[] = [];
  selectedSipExtension: { [userId: string]: string } = {};
  cancelTargetId: string | null = null;
  showCancelModal: boolean = false;

  loading = false;
  pageSizeControl!: FormControl;
  Math = Math; // Expose Math to template
  //  _currentUser: CurrentUser | null = null;
  _userSub?: Subscription;

  activeFilter: 'all' | 'true' | 'false' = 'all';
  filteredUsers: any[] = [];

  highlightNewUserId: string | null = null;

  public _userSession: UserSession | null = null;

  constructor(
    private _userSessionService: UserSessionService,
    private _dialog: MatDialog,
    private _userService: UserService
  ) {
    this.pageSizeControl = new FormControl(this.pageSize);
  }

  displayedColumns: string[] = [
    'username',
    'email_address',
    'full_name',
    'title',
    'security_level',
    'avatar',
    'actions',
  ];

  ngOnInit(): void {
    this.loadUsers();
    this.pageSizeControl.valueChanges.subscribe((size: number) => this.pageSizeChanged(size));
    this._userSub = this._userSessionService.userSession$.subscribe((userSession) => {
      this._userSession = userSession;
      // you can now access this.currentUser in your component
      //console.log('Current userSession:', this._userSession?.id);
    });
  }

  openDetails(user?: User): void {
    console.log('Opening user dialog for:', user);
    const dialogRef = this._dialog.open(UserDialogComponent, {
      width: '80vw', // 80% of viewport width
      height: '80vh', // 80% of viewport height
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'user-dialog',
      data: {
        user: user || null,
        isNew: !user,
        currentUserId: this._userSession?.user_id, // Pass current user ID for audit
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'updated') {
        this.loadUsers(); // ⬅️ refresh the grid
      }
    });
  }
  // getSipEnabledControl(userId: string): FormControl {
  //   return this.editForms[userId].get('sip_enabled') as FormControl;
  // }

  // getSipExtensionControl(userId: string): FormControl {
  //   return this.editForms[userId].get('sip_extension') as FormControl;
  // }

  // getActiveControl(userId: string): FormControl {
  //   return this.editForms[userId].get('active') as FormControl;
  // }

  // toggleSipAssignment(userId: string) {
  //   const form = this.editForms[userId];
  //   const enabled = form.get('sip_enabled')?.value;
  // }

  openCancelConfirm(userId: string) {
    this.cancelTargetId = userId;
    this.showCancelModal = true;
  }

  // confirmCancel() {
  //   if (!this.cancelTargetId) return;
  //   this.cancelTargetId.startsWith('temp-')
  //     ? this.cancelNewUser(this.cancelTargetId)
  //     : this.toggleRow(this.cancelTargetId);
  //   this.cancelTargetId = null;
  //   this.showCancelModal = false;
  // }

  closeCancelModal() {
    this.cancelTargetId = null;
    this.showCancelModal = false;
  }

  openCreateUser(): void {
    const dialogRef = this._dialog.open(UserDialogComponent, {
      width: '80vw', // 80% of viewport width
      height: '80vh', // 80% of viewport height
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'user-dialog',
      data: { isNew: true, currentUserId: this._userSession?.user_id }, // ⬅️ no user object, triggers create mode
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'created') {
        this.loadUsers(); // refresh user grid
      }
    });
  }

  // addNewUser() {
  //   const newUser = {
  //     id: `temp-${Date.now()}`,
  //     username: '',
  //     email_address: '',
  //     first_name: '',
  //     last_name: '',
  //     title: '',
  //     avatar: 'default-avatar.png',
  //     active: true,
  //     security_level: '',
  //     sip_enabled: false,
  //     sipData: {
  //       id: '',
  //       extension: '',
  //       sip_password: '',
  //       sip_server: '',
  //     },
  //   };

  //   // dynamically generate form for newUser
  //   this.editForms[newUser.id] = this._fb.group(
  //     (Object.keys(newUser) as (keyof typeof newUser)[]).reduce((acc, key) => {
  //       const value = newUser[key];
  //       if (typeof value === 'object' && value !== null) {
  //         acc[key] = this._fb.group(
  //           (Object.keys(value) as (keyof typeof value)[]).reduce((subAcc, subKey) => {
  //             subAcc[subKey] = [value[subKey]];
  //             return subAcc;
  //           }, {} as any)
  //         );
  //       } else {
  //         acc[key] = [value];
  //       }
  //       return acc;
  //     }, {} as any)
  //   );

  //   // add to top of array
  //   this.users.unshift(newUser);
  //   this.expandedRows.add(newUser.id);
  // }

  loadSipExtensions() {
    this._userService.loadAvailableSipExtensions().subscribe({
      next: (data: any[]) => (this.sipExtensions = data),
      error: (err) => console.error('Failed to load SIP extensions', err),
    });
  }

  loadUsers(): void {
    this.loading = true;
    this._userService.getUsers(this.page, this.pageSize, this.activeFilter).subscribe({
      next: (res: any) => {
        console.log('user response:', res);
        this.users = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  // loadUsers(): void {
  //   this._userService
  //     .getUsers(this.page, this.pageSize, this.activeFilter)
  //     .subscribe((res: any) => {
  //       console.log('loadUsers - res.data received:', res.data);
  //       this.users = res.data;
  //       this.total = res.total;
  //       this.users.forEach((user) => {
  //         if (!this.editForms[user.id]) {
  //           this.editForms[user.id] = this._fb.group({
  //             username: [user.username],
  //             email_address: [user.email_address],
  //             first_name: [user.first_name],
  //             last_name: [user.last_name],
  //             title: [user.title],
  //             security_level: [user.security_level],
  //             avatar: [user.avatar || 'default-avatar.png'],
  //             active: user.active,
  //             avatarPreview: [null],
  //             sip_enabled: [!!user.sip_enabled],
  //             sip_extension: [user.sipData?.extension || ''],
  //           });
  //         }
  //       });
  //     });
  // }

  // applyFilter() {
  //   console.log('users being filtered', this.users);
  //   if (this.activeFilter === 'all') {
  //     this.filteredUsers = [...this.users];
  //   } else {
  //     console.log('filtering:', this.activeFilter);
  //     const isActive = this.activeFilter === 'true';
  //     this.filteredUsers = this.users.filter(
  //       (u) => Boolean(u.active) === isActive
  //     );
  //   }
  // }

  toggleRow(userId: string): void {
    if (this.expandedRows.has(userId)) this.expandedRows.delete(userId);
    else {
      this.expandedRows.clear();
      this.expandedRows.add(userId);
    }
  }

  // onAvatarSelected(event: Event, userId: string): void {
  //   const file = (event.target as HTMLInputElement).files?.[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = () => this.editForms[userId].patchValue({ avatarPreview: reader.result });
  //   reader.readAsDataURL(file);

  //   this._userService.uploadAvatar(file).subscribe((res: any) => {
  //     this.editForms[userId].patchValue({
  //       avatar: res.filename,
  //       avatarPreview: null,
  //     });
  //   });
  // }

  // saveUser(userId: string): void {
  //   const form = this.editForms[userId];
  //   if (!form.valid) return;
  //   const payload = { ...form.value };
  //   delete payload.avatarPreview;
  //   //const currentUserId: string = this._currentUser!.id;
  //   const isNewUser = userId.startsWith('temp-');

  //   if (isNewUser) {
  //     payload.active = true;
  //     this._userService.createUser(payload).subscribe({
  //       next: (instance: User) => {
  //         // Remove temp edit form and expanded row
  //         delete this.editForms[userId];
  //         this.expandedRows.delete(userId);

  //         // Save new user ID for highlighting
  //         this.highlightNewUserId = instance.id;

  //         // Force page back to page 1 so new record on top - Reload all users
  //         this.page = 1;
  //         this.loadUsers();

  //         // Optional: remove highlight after a few seconds
  //         setTimeout(() => {
  //           this.highlightNewUserId = null;
  //         }, 3000);
  //       },
  //       error: (err) => console.error('Failed to create user', err),
  //     });
  //   } else {
  //     let tempUser = this.users.find((u) => u.id === userId);
  //     let payloadWithSipData = { ...payload, sipData: tempUser!['sipData'] };
  //     console.log('payloadWithSip', payloadWithSipData);
  //     this._userService.updateUser(userId, payloadWithSipData).subscribe({
  //       next: (res) => {
  //         this.loadUsers();
  //         this.expandedRows.delete(userId);
  //       },
  //       error: (err) => console.error('Failed to update user', err),
  //     });
  //   }
  // }

  // cancelNewUser(userId: string): void {
  //   const index = this.users.findIndex((u) => u.id === userId);
  //   if (index !== -1) this.users.splice(index, 1);
  //   delete this.editForms[userId];
  //   this.expandedRows.delete(userId);
  // }

  // toggleUserActiveSwitch(user: User) {
  //   const newActive = !user.active;
  //   const input = {
  //     id: user.id,
  //     active: newActive,
  //     sipEnabled: !user.sip_enabled,
  //     sipExtensionId: !user.sipData?.id,
  //   };
  //   // Optimistic UI
  //   user.active = newActive;

  //   this._userService.toggleUserActive(input).subscribe({
  //     next: (updatedUser) => {
  //       console.log('User active status updated:', updatedUser);
  //       this.loadUsers();
  //     },
  //     error: (err) => {
  //       console.error('Failed to toggle active:', err);
  //       // Revert on error
  //       user.active = !newActive;
  //     },
  //   });
  // }

  pageChanged(newPage: number): void {
    this.page = newPage;
    this.loadUsers();
  }

  pageSizeChanged(newSize: number): void {
    this.pageSize = newSize;
    this.page = 1;
    this.loadUsers();
  }
}
