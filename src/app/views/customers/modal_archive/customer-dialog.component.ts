import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Customer, Contact, Address, Phone, Note } from '../../../services/customer/customer.type';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';

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
    MatTabsModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatTableModule,
    MatIconModule
  ],
})
export class CustomerDialogComponent implements OnInit {
  form: FormGroup;
  isNew: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CustomerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { customer?: Customer }
  ) {
    this.isNew = !data.customer;

    // Initialize main form
    this.form = this.fb.group({
      name: [data.customer?.name || '', Validators.required],
      company_name: [data.customer?.company_name || '', Validators.required],
      email_address: [data.customer?.email_address || '', [Validators.required, Validators.email]],
      status: [data.customer?.status ?? true, Validators.required],

      contacts: this.fb.array([]),
      addresses: this.fb.array([]),
      phones: this.fb.array([]),
      notes: this.fb.array([]),
    });
  }

  contactColumns = ['first_name', 'last_name', 'email', 'phone', 'actions'];
  addressColumns = ['type', 'address_line_1', 'city', 'state', 'zip', 'actions'];
  phoneColumns = ['type', 'number', 'extension', 'actions'];
  noteColumns = ['content', 'createdAt', 'actions'];

  ngOnInit(): void {
    // Populate FormArrays if editing existing customer
    if (this.data.customer) {
      this.setFormArray('contacts', this.data.customer.contacts);
      this.setFormArray('addresses', this.data.customer.addresses);
      this.setFormArray('phones', this.data.customer.phones);
      this.setFormArray('notes', this.data.customer.notes);
    }
  }

  // --------- FormArray Helpers ---------
  get contacts(): FormArray {
    return this.form.get('contacts') as FormArray;
  }

  get addresses(): FormArray {
    return this.form.get('addresses') as FormArray;
  }

  get phones(): FormArray {
    return this.form.get('phones') as FormArray;
  }

  get notes(): FormArray {
    return this.form.get('notes') as FormArray;
  }

  private setFormArray(arrayName: string, items?: any[]) {
    const formArray = this.form.get(arrayName) as FormArray;
    if (items && items.length > 0) {
      items.forEach((item) => formArray.push(this.createGroup(arrayName, item)));
    }
  }

  private createGroup(arrayName: string, item?: any): FormGroup {
    switch (arrayName) {
      case 'contacts':
        return this.fb.group({
          id: [item?.id || ''],
          customer_id: [item?.customer_id || ''],
          first_name: [item?.first_name || '', Validators.required],
          last_name: [item?.last_name || '', Validators.required],
          title: [item?.title || ''],
          email: [item?.email || '', Validators.email],
          phone: [item?.phone || ''],
        });

      case 'addresses':
        return this.fb.group({
          id: [item?.id || ''],
          customer_id: [item?.customer_id || ''],
          type: [item?.type || '', Validators.required],
          address_line_1: [item?.address_line_1 || '', Validators.required],
          address_line_2: [item?.address_line_2 || ''],
          city: [item?.city || '', Validators.required],
          state: [item?.state || '', Validators.required],
          zip: [item?.zip || '', Validators.required],
          country: [item?.country || '', Validators.required],
        });

      case 'phones':
        return this.fb.group({
          id: [item?.id || ''],
          customer_id: [item?.customer_id || ''],
          type: [item?.type || '', Validators.required],
          number: [item?.number || '', Validators.required],
          extension: [item?.extension || ''],
        });

      case 'notes':
        return this.fb.group({
          id: [item?.id || ''],
          customer_id: [item?.customer_id || ''],
          content: [item?.content || '', Validators.required],
          createdAt: [item?.createdAt || new Date().toISOString()],
          createdBy: [item?.createdBy || ''],
        });

      default:
        return this.fb.group({});
    }
  }

  // --------- Add/Remove Actions ---------
  addContact() {
    this.contacts.push(this.createGroup('contacts'));
  }
  removeContact(index: number) {
    this.contacts.removeAt(index);
  }

  addAddress() {
    this.addresses.push(this.createGroup('addresses'));
  }
  removeAddress(index: number) {
    this.addresses.removeAt(index);
  }

  addPhone() {
    this.phones.push(this.createGroup('phones'));
  }
  removePhone(index: number) {
    this.phones.removeAt(index);
  }

  addNote() {
    this.notes.push(this.createGroup('notes'));
  }
  removeNote(index: number) {
    this.notes.removeAt(index);
  }

  // --------- Save/Close ---------
  saveCustomer() {
    if (this.form.valid) {
      const customerData: Customer = this.form.value;
      this.dialogRef.close(customerData);
    } else {
      this.form.markAllAsTouched();
    }
  }

  saveSection(section: 'contacts' | 'addresses' | 'phones' | 'notes') {
    // If needed, handle partial section updates separately
    console.log(`${section} updated`, this.form.get(section)?.value);
  }

  close() {
    this.dialogRef.close();
  }
}
