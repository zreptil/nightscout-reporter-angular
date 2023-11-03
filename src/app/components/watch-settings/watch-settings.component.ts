import {Component} from '@angular/core';
import {SessionService} from '@/_services/session.service';
import {DialogResultButton} from '@/_model/dialog-data';
import {MatDialogRef} from '@angular/material/dialog';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {ColorData} from '@/_model/color-data';
import {WatchService} from '@/_services/watch.service';
import {Utils} from '@/classes/utils';

@Component({
  selector: 'app-watch-settings',
  templateUrl: './watch-settings.component.html',
  styleUrls: ['./watch-settings.component.scss']
})
export class WatchSettingsComponent {
  colpick: ColorData;
  savedColors: ColorData[] = [];

  constructor(private dlgRef: MatDialogRef<WatchSettingsComponent>,
              public ss: SessionService,
              public ws: WatchService) {

  }

  get watchColorLabel(): string {
    return GLOBALS.isWatchColor ? $localize`Farbig` : $localize`Dunkel`;
  }

  get lluAutoExecLabel(): string {
    return $localize`LibreLinkUp aufrufen, wenn der Glukosewert veraltet ist`;
  }

  get maxGlucAgeLabel(): string {
    return $localize`Zeit, nach der der Glukosewert als veraltet interpretiert wird`;
  }

  get lluTimeoutLabel(): string {
    return $localize`Intervall zwischen den periodischen Übertragungen der Daten von LibreLinkUp nach Nightscout`;
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  clickSave() {
    this.ws.clearSelected();
    this.dlgRef.close({btn: DialogResultButton.ok});
  }

  changeGlucUnits(value: number) {
    GLOBALS.glucMGDLIdx = value;
  }

  msgMinute(value: number) {
    return Utils.plural(value, {
      1: $localize`Minute`,
      other: $localize`Minuten`
    });
  }
}
