import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallDataService } from '../../services/callData/calldata.service';
import { takeUntil, Subject } from 'rxjs';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  dataFeed1: string = 'Loading...';
  dataFeed2: string = 'Loading...';
  dataFeed3: string = 'Loading...';
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  public callCount$!: Number | 0;
  public liveUserCount$!: Number | 0;

  constructor(
    private _callDataService: CallDataService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => (this.dataFeed1 = '42'), 1000);
    setTimeout(() => (this.dataFeed2 = '128'), 1500);
    setTimeout(() => (this.dataFeed3 = '76'), 2000);

    this._callDataService.callCount$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((callCount) => {
        this.callCount$ = callCount;
        // Mark for check
        this._changeDetectorRef.markForCheck();
      });

      this._callDataService.liveUserCount$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((liveUserCount) => {
        this.liveUserCount$ = liveUserCount;
        // Mark for check
        this._changeDetectorRef.markForCheck();
      });
  }
}
