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
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Observable, of, map, take, switchMap, catchError } from 'rxjs';
import { UserService } from '../../../../services/user/user.service';
import { User } from '../../../../services/user/user.type';
import { SystemVariablesService } from '../../../../services/system-variables/system-variables.service';

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
    MatListModule,
    FormsModule,
    MatTabsModule,
  ],
})
export class UserDialogComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;
  avatarPreview: string | ArrayBuffer | null = null;
  resourceURL: string = 'https://polybiuscc-resources.polybiusllc.com/avatars/';
  currentUserID: string | undefined;

  // --- inside UserDialogComponent ---
  availableSkills: string[] = [];
  assignedSkills: string[] = [];
  selectedAvailable: string[] = [];
  selectedAssigned: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    private userService: UserService,
    private _systemVariablesService: SystemVariablesService,
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

    this.loadAvailableSkills();

    // Parse user's existing skills (now stored as JSON array)
    let skills: string[] = [];

    try {
      if (Array.isArray(this.data.user?.skill_groups)) {
        // already an array (from API)
        skills = this.data.user.skill_groups;
      } else if (typeof this.data.user?.skill_groups === 'string') {
        // could be JSON string (edge case: DB or cached value)
        const parsed = JSON.parse(this.data.user.skill_groups);
        if (Array.isArray(parsed)) skills = parsed;
      }
    } catch (err) {
      console.warn('Failed to parse skill_groups:', err);
    }

    this.assignedSkills = [...skills];
  }

  loadAvailableSkills() {
    this._systemVariablesService.getAll('skill_groups').subscribe({
      next: (skills) => {
        // Extract just the names (e.g., 'InCall', 'Break', 'Meeting')
        const allSkills = skills.map((s: any) => s.name);

        // Remove any that are already assigned to the user
        this.availableSkills = allSkills.filter(
          (skill: string) => !this.assignedSkills.includes(skill)
        );
      },
      error: (err) => console.error('Failed to load skill groups:', err),
    });
  }

  compareStrings(a: string, b: string): boolean {
    return a === b;
  }

  addSelectedSkills() {
    this.selectedAvailable.forEach((skill) => {
      if (!this.assignedSkills.includes(skill)) {
        this.assignedSkills.push(skill);
      }
    });
    this.availableSkills = this.availableSkills.filter(
      (skill) => !this.selectedAvailable.includes(skill)
    );
    this.selectedAvailable = [];
  }

  removeSelectedSkills() {
    this.selectedAssigned.forEach((skill) => {
      if (!this.availableSkills.includes(skill)) {
        this.availableSkills.push(skill);
      }
    });
    this.assignedSkills = this.assignedSkills.filter(
      (skill) => !this.selectedAssigned.includes(skill)
    );
    this.selectedAssigned = [];
  }

  usernameValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const currentUserName = this.data.user?.username;

    return this.userService.checkUsername(control.value).pipe(
      map((exists) => {
        // If username exists and it's NOT the current user, fail validation
        if (exists && control.value !== this.data.user?.username) {
          return { usernameTaken: true };
        }
        return null;
      }),
      catchError(() => of(null))
    );
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

    // Add group_skills field before saving
    //const skill_groups = JSON.stringify(this.assignedSkills);
    formValue.skill_groups = JSON.stringify(this.assignedSkills);

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
