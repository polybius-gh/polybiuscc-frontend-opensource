// system-variables.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { SystemVariablesService } from '../../../services/system-variables/system-variables.service';
import { SystemVariableModal } from '../../../pages/system-variables/system-variables.modal';
import { SystemVariable } from '../../../services/system-variables/system-variable.type';

@Component({
  selector: 'app-system-variables',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTableModule, MatTabsModule, MatIconModule],
  templateUrl: './system-variables.html',
})

export class SystemVariables implements OnInit {
  variableTypes = ['user_status', 'inbound_actions', 'skill_groups'];
  data: { [key: string]: SystemVariable[] } = {};
  selectedType = 'user_status';
  displayedColumns = ['name', 'description', 'actions'];

  constructor(private service: SystemVariablesService, private dialog: MatDialog) {}

  ngOnInit() {
    this.variableTypes.forEach((type) => this.loadData(type));
  }

  onTabChange(index: number) {
    this.selectedType = this.variableTypes[index];
  }

  loadData(type: string) {
    this.service.getAll(type).subscribe((res) => (this.data[type] = res));
  }

  openDialog(type: string, variable?: SystemVariable) {
    const dialogRef = this.dialog.open(SystemVariableModal, {
      width: '400px',
      data: { type, variable },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadData(type);
    });
  }

  deleteVariable(type: string, id: string) {
    this.service.delete(type, id).subscribe(() => this.loadData(type));
  }
}
