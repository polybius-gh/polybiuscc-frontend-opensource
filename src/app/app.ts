import { Component, OnInit, AfterViewInit, signal, ViewChild, ElementRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SipService } from './services/jssip/jssip.service';
import { AuthService } from './services/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit {
  @ViewChild('sipAudio', { static: true })
  sipAudio!: ElementRef<HTMLAudioElement>;

  protected readonly title = signal('polybiuscc-frontend');

  constructor(private sipService: SipService, private _authService: AuthService) {}

  ngOnInit() {

  }

  ngAfterViewInit(): void {
    this.sipService.setMediaElement(this.sipAudio.nativeElement);
  }
}
