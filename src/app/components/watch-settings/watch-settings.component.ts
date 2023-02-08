import {Component} from '@angular/core';
import {SessionService} from '@/_services/session.service';
import {DialogResultButton} from '@/_model/dialog-data';
import {MatDialogRef} from '@angular/material/dialog';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';

@Component({
  selector: 'app-watch-settings',
  templateUrl: './watch-settings.component.html',
  styleUrls: ['./watch-settings.component.scss']
})
export class WatchSettingsComponent {
  constructor(private dlgRef: MatDialogRef<WatchSettingsComponent>,
              public ss: SessionService) {

  }

  get watchColorLabel(): string {
    return GLOBALS.isWatchColor ? $localize`Farbig` : $localize`Dunkel`;
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  clickSave() {
    this.dlgRef.close({btn: DialogResultButton.ok});
  }

}
