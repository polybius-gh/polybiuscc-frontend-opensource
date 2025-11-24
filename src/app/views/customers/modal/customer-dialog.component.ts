import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable, of, map, take, switchMap } from 'rxjs';
import { CustomerService } from '../../../services/customer/customer.service';
import { NewCustomer } from '../../../services/customer/customer.type';

interface CustomerDialogData {
  customer?: NewCustomer;
  isNew?: boolean;
  currentUserId?: string; // or number depending on your id type
}

@Component({
  selector: 'app-customer-dialog',
  templateUrl: './customer-dialog.component.html',
  styleUrls: ['./customer-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatCardModule,
    MatDividerModule,
  ],
})
export class CustomerDialogComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;
  currentUserID: string | undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CustomerDialogComponent>,
    private customerService: CustomerService,
    @Inject(MAT_DIALOG_DATA) public data: CustomerDialogData
  ) {
    this.isEditMode = !!data?.customer;

    const thisCustomer = data?.customer;

    this.form = this.fb.group({
      id: [thisCustomer?.id || ''],
      name: [thisCustomer?.name || ''],
      company_name: [thisCustomer?.company_name || ''],
      email_address: [thisCustomer?.email_address || '', [Validators.required, Validators.email]],
      status: [thisCustomer?.active || ''],
      address_line_1: [thisCustomer?.address_line_1 || ''],
      address_line_2: [thisCustomer?.address_line_2 || ''],
      city: [thisCustomer?.city || ''],
      state: [thisCustomer?.state || ''],
      postal_code: [thisCustomer?.postal_code || ''],
      country: [thisCustomer?.country || ''],
      phone_number: [thisCustomer?.phone_number || ''],
    });
  }

  ngOnInit(): void {
    console.log('CustomerDialogComponent initialized with data:', this.data);
    console.log('edit mode:', this.isEditMode);
  }

  save() {
    console.log('save was called');
    if (this.form.invalid) return;

    const formValue = this.form.value;

    const currentUserId = this.data.currentUserId;

    const payload = {
      ...formValue,
      currentUserId,
    };
    console.log('Payload for save:', payload);

    const request$ =
      this.isEditMode && this.data.customer?.id
        ? this.customerService.updateCustomer(payload).pipe(map(() => 'updated'))
        : this.customerService.createCustomer(payload).pipe(map(() => 'created'));

    request$.subscribe({
      next: (status) => {
        console.log(`Customer successfully ${status}.`);
        this.dialogRef.close(true); // optional: close dialog and signal refresh
      },
      error: (err) => {
        console.error('Save failed:', err);
        // optionally show a toast/snackbar
      },
    });
  }

  // save() {
  //   if (this.form.invalid) return;

  //   const formValue = this.form.value;
  //   const currentUserId = this.data.currentUserId;

  //   const handleAvatarUpload = (): Observable<string | null> => {
  //     if (formValue.avatar instanceof File) {
  //       return this.userService.uploadAvatar(formValue.avatar).pipe(
  //         map(res => res.filename)
  //       );
  //     }
  //     return of(formValue.avatar || null);
  //   };

  //   handleAvatarUpload().pipe(
  //     take(1),
  //     switchMap((avatarFilename) => {
  //       const payload = {
  //         ...formValue,
  //         avatar: avatarFilename,
  //         currentUserId,
  //       };

  //       if (this.isEditMode && this.data.user?.id) {
  //         // UPDATE
  //         return this.userService.updateUser(this.data.user.id, payload).pipe(
  //           map(() => 'updated')   // ⬅️ Important
  //         );
  //       } else {
  //         // CREATE
  //         return this.userService.createUser(payload).pipe(
  //           map(() => 'created')   // ⬅️ Important
  //         );
  //       }
  //     })
  //   ).subscribe({
  //     next: (result) => this.dialogRef.close(result),  // ⬅️ returns 'updated' or 'created'
  //     error: (err) => console.error('Save failed', err),
  //   });
  // }

  // save() {
  //   console.log('data.currentUserID:', this.data.currentUserId);
  //   let currentUserID = this.data.currentUserId;
  //   if (this.form.invalid) return;

  //   const formValue = this.form.value;

  //   const formData = new FormData();
  //   Object.keys(formValue).forEach(key => {
  //     if (key === 'avatar' && formValue.avatar instanceof File) {
  //       formData.append('avatar', formValue.avatar);
  //     } else {
  //       formData.append(key, formValue[key]);
  //     }
  //   });

  //   this.userService.updateUser('1234', formData).subscribe({
  //     next: (res) => this.dialogRef.close(res),
  //     error: (err) => console.error('Save failed', err),
  //   });
  // }

  close() {
    this.dialogRef.close();
  }
}
