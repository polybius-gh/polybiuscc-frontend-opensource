import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialpad-modal',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './dialpad-modal.css',
  templateUrl: './dialpad-modal.html'
})
export class DialpadModal {
  @Output() onCall = new EventEmitter<string>();
  @Output() onClose = new EventEmitter<void>();

  public dialedNumber: string = '';
  public dialpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  pressKey(key: string) {
    this.dialedNumber += key;
  }

  call() {
    if (this.dialedNumber) {
      this.onCall.emit(this.dialedNumber);
    }
  }

  close() {
    this.onClose.emit();
  }
}
