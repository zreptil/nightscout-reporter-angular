import {Component, Input, Optional} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {MatDialogRef} from '@angular/material/dialog';
import {Log} from '@/_services/log.service';
import {NightscoutService} from '@/_services/nightscout.service';
import {SessionService} from '@/_services/session.service';

@Component({
  selector: 'app-close-button',
  templateUrl: './close-button.component.html',
  styleUrls: ['./close-button.component.scss']
})
export class CloseButtonComponent {

  @Input()
  data: CloseButtonData = new CloseButtonData();

  constructor(
    public ns: NightscoutService,
    public ss: SessionService,
    @Optional() public dialogRef: MatDialogRef<any>) {
  }

  get showColorCfg(): boolean {
    return GLOBALS.editColors && this.data.colorKey != null;
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get mayDebug(): boolean {
    return Log.mayDebug;
  }

  clickClose() {
    if (this.data.closeAction != null) {
      this.data.closeAction?.().subscribe(result => {
        if (result) {
          this.dialogRef?.close(this.data.dialogClose);
        }
      });
    } else {
      this.dialogRef?.close(this.data.dialogClose);
    }
  }

  clickDebugTrigger() {
    this.ns.reportData = null;
    GLOBALS.isDebug = !GLOBALS.isDebug;
    this.ss.checkPrint();
  }
}
