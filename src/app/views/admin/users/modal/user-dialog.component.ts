import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable, of, map, take, switchMap, catchError } from 'rxjs';
import { UserService } from '../../../../services/user/user.service';
import { User } from '../../../../services/user/user.type';

interface UserDialogData {
  user?: User;
  isNew?: boolean;
  currentUserId?: string; // or number depending on your id type
}

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
    MatSelectModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
  ],
})
export class UserDialogComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;
  avatarPreview: string | ArrayBuffer | null = null;
  resourceURL: string = 'https://polybiuscc-resources.polybiusllc.com/avatars/';
  currentUserID: string | undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData
  ) {
    this.isEditMode = !!data?.user;

    const thisUser = data?.user;
    //this.currentUserID = data?.currentUserID;

    this.form = this.fb.group({
      username: [
        thisUser?.username || '',
        {
          validators: [Validators.required],
          asyncValidators: [this.usernameValidator.bind(this)],
          updateOn: 'blur', // only run validator when field loses focus
        },
      ],
      first_name: [thisUser?.first_name || '', Validators.required],
      last_name: [thisUser?.last_name || '', Validators.required],
      email_address: [thisUser?.email_address || '', [Validators.required, Validators.email]],
      title: [thisUser?.title || ''],
      avatar: [thisUser?.avatar || ''],
      active: [thisUser?.active ?? true],
      security_level: [thisUser?.security_level || 'user', Validators.required],
      sip_enabled: [thisUser?.sip_enabled ?? false],
      sipData: [thisUser?.sipData || null],
    });

    // Initialize avatar preview
    //this.avatarPreview = thisUser?.avatar ? this.getAvatarUrl(thisUser.avatar) : null;
    // Initialize avatar preview
    if (thisUser?.avatar) {
      this.avatarPreview = this.getAvatarUrl(thisUser.avatar);
    } else {
      // Default avatar for new user
      this.avatarPreview = this.getAvatarUrl('default-avatar.png');
      this.form.patchValue({ avatar: 'default-avatar.png' });
    }
  }

  ngOnInit(): void {
    console.log('UserDialogComponent initialized with data:', this.data);
    //let currentUserID = this.data?.currentUserID;
  }

  usernameValidator(control: AbstractControl): Observable<ValidationErrors | null> {

    const currentUserName = this.data.user?.username;

    return this.userService.checkUsername(control.value).pipe(
       map(exists => {
      // If username exists and it's NOT the current user, fail validation
      if (exists && control.value !== this.data.user?.username) {
        return { usernameTaken: true };
      }
      return null;
    }),
    catchError(() => of(null))
  )
  }

  private getAvatarUrl(fileName: string) {
    return `${this.resourceURL}${fileName}`;
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const currentUserId = this.data.currentUserId;

    console.log('Form value before save:', formValue);
    // sets sip_enabled to false if deactivating user - housekeeping for SIP assignments
    if (formValue.active === false) {
      formValue.sip_enabled = 0;
      console.log('Updated formValue for save', formValue);
    }

    const handleAvatarUpload = (): Observable<string | null> => {
      if (formValue.avatar instanceof File) {
        return this.userService.uploadAvatar(formValue.avatar).pipe(map((res) => res.filename));
      }
      return of(formValue.avatar || null);
    };

    handleAvatarUpload()
      .pipe(
        take(1),
        switchMap((avatarFilename) => {
          const payload = {
            ...formValue,
            avatar: avatarFilename,
            currentUserId,
          };

          if (this.isEditMode && this.data.user?.id) {
            // UPDATE
            return this.userService.updateUser(this.data.user.id, payload).pipe(
              map(() => 'updated') // ⬅️ Important
            );
          } else {
            // CREATE
            return this.userService.createUser(payload).pipe(
              map(() => 'created') // ⬅️ Important
            );
          }
        })
      )
      .subscribe({
        next: (result) => this.dialogRef.close(result), // ⬅️ returns 'updated' or 'created'
        error: (err) => console.error('Save failed', err),
      });
  }

  close() {
    this.dialogRef.close();
  }
}
