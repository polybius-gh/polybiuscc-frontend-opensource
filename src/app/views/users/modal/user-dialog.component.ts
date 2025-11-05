import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { User } from '../../../services/user/user.types';

@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss'],
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
  ]
})
export class UserDialogComponent {
  form: FormGroup;
  isEditMode: boolean;
  avatarPreview: string | ArrayBuffer | null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: User
  ) {
    this.isEditMode = !!data;

    this.form = this.fb.group({
      username: [data?.username || '', Validators.required],
      first_name: [data?.first_name || '', Validators.required],
      last_name: [data?.last_name || '', Validators.required],
      email_address: [data?.email_address || '', [Validators.required, Validators.email]],
      title: [data?.title || ''],
      avatar: [data?.avatar || ''],
      active: [data?.active ?? true],
      security_level: [data?.security_level || 'user', Validators.required],
      sip_enabled: [data?.sip_enabled ?? false],
      sipData: [data?.sipData || null], // viewable for now
    });

    // Initialize avatar preview
    this.avatarPreview = data?.avatar ? this.getAvatarUrl(data.avatar) : null;
  }

  private getAvatarUrl(fileName: string) {
    return `/assets/avatars/${fileName}`; // adjust to match your resourceURL
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.form.patchValue({ avatar: file });

      const reader = new FileReader();
      reader.onload = () => (this.avatarPreview = reader.result);
      reader.readAsDataURL(file);
    }
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
