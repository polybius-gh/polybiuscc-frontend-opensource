import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SystemVariablesService } from '../../services/system-variables/system-variables.service';
import { SystemVariable } from '../../services/system-variables/system-variable.type';

@Component({
  selector: 'app-system-variable-dialog',
  standalone: true,
  templateUrl: './system-variables.modal.html',
  styleUrls: ['./system-variables.modal.scss'],
  
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    ReactiveFormsModule
  ],
})
export class SystemVariableModal {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: SystemVariablesService,
    private dialogRef: MatDialogRef<SystemVariableModal>,
    @Inject(MAT_DIALOG_DATA) public data: { type: string; variable?: SystemVariable }
  ) {
    this.form = this.fb.group({
      name: [data.variable?.name || '', Validators.required],
      description: [data.variable?.description || ''],
      type: [data.variable?.type || data.type, Validators.required],
    });
  }

  save() {
    const payload: SystemVariable = this.form.value;
    if (this.data.variable?.id) {
      this.service.update(this.data.type, this.data.variable.id, payload)
        .subscribe(() => this.dialogRef.close(true));
    } else {
      this.service.create(this.data.type, payload)
        .subscribe(() => this.dialogRef.close(true));
    }
  }
}
