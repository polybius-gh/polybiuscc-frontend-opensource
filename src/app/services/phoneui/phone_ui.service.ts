import {
  ApplicationRef,
  ComponentRef,
  Injectable,
  Injector,
  createComponent,
  EnvironmentInjector
} from '@angular/core';
import { DialpadModal } from '../../pages/dialpad-modal/dialpad-modal';
import { SipService } from '../jssip/jssip.service';

@Injectable({ providedIn: 'root' })
export class PhoneUIService {
  private dialpadRef?: ComponentRef<DialpadModal>;

  constructor(private appRef: ApplicationRef, private _sipService: SipService, private injector: Injector, private environmentInjector: EnvironmentInjector) {}

  openDialpad(): void {
    if (this.dialpadRef) return; // already open
    console.log('Opening dialpad');
    // ✅ Create the component dynamically
    this.dialpadRef = createComponent(DialpadModal, {
      environmentInjector: this.environmentInjector,
    });

    // Attach to application
    this.appRef.attachView(this.dialpadRef.hostView);

    // Append to DOM
    const domElem = (this.dialpadRef.hostView as any)
      .rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);

    // Subscribe to events
    this.dialpadRef.instance.onCall.subscribe((number) => {
      console.log('Dialing:', number);
       this._sipService.makeCall(number);
      this.closeDialpad();
    });

    this.dialpadRef.instance.onClose.subscribe(() => this.closeDialpad());
  }

  closeDialpad(): void {
    if (this.dialpadRef) {
      this.appRef.detachView(this.dialpadRef.hostView);
      this.dialpadRef.destroy();
      this.dialpadRef = undefined;
    }
  }
}
