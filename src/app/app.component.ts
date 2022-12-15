import {ChangeDetectorRef, Component} from '@angular/core';
import {GLOBALS} from '@/_model/globals-data';
import {LogService} from '@/_services/log.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(cr: ChangeDetectorRef) {
    LogService.cr = cr;
  }

  get globals() {
    return GLOBALS;
  }

  get appType(): string {
    return window.location.hash?.substring(1);
  }
}
