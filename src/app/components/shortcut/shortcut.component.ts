import {Component, OnInit} from '@angular/core';
import {EnvironmentService} from '@/_services/environment.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {ShortcutData} from '@/_model/shortcut-data';
import {SessionService} from '@/_services/session.service';
import {DataService} from '@/_services/data.service';
import {PdfService} from '@/_services/pdf.service';
import {NightscoutService} from '@/_services/nightscout.service';
import {PeriodShift} from '@/_model/period-shift';
import {Utils} from '@/classes/utils';

@Component({
  selector: 'app-shortcut',
  templateUrl: './shortcut.component.html',
  styleUrls: ['./shortcut.component.scss']
})
export class ShortcutComponent implements OnInit {
  shortcut: ShortcutData = null;

  constructor(public env: EnvironmentService,
              public ss: SessionService,
              public ds: DataService,
              public pdf: PdfService,
              public ns: NightscoutService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  afterLoadDevice(): void {
    this.shortcut = GLOBALS.shortcutList.find(sc => sc.name.toLowerCase() === this.env.appParams?.name?.toLowerCase());
    if (this.shortcut != null) {
      // make sure the value uses the correct factor
      GLOBALS.user.adjustGluc = GLOBALS.user.adjustGluc;
      let shift = +(this.env.appParams.shift ?? 0);
      if (shift < 0) {
        shift = 0;
      }
      let title = $localize`Ausgewählter Zeitraum`;
      if (shift > 0) {
        title = Utils.plural(shift, {
          0: $localize`Ausgewählter Zeitraum`,
          1: $localize`Ein Monat vorher`,
          other: $localize`${shift} Monate vorher`
        });
      }
      console.log(this.env.appParams);
      console.log(this.env.appParams.shift);
      console.log(+this.env.appParams.shift, shift);
      GLOBALS.currPeriodShift = new PeriodShift(title, shift);
      GLOBALS.ppPdfSameWindow = true;
      GLOBALS.ppPdfDownload = false;
      this.pdf.generatePdf().then(_ => {
        if (!this.ns.reportData?.isValid) {
          this.ss.showPopup('outputparams');
        }
      });
    }
  }

  ngOnInit(): void {
    this.ds.onAfterLoadDevice = this.afterLoadDevice.bind(this);
    this.ss.initialLoad().then(() => {
    });
  }

  clickBack() {
    location.href = location.origin;
  }
}
