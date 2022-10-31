import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';

@Component({
  selector: 'app-gluc-adjust',
  templateUrl: './gluc-adjust.component.html',
  styleUrls: ['./gluc-adjust.component.scss']
})
export class GlucAdjustComponent implements OnInit {
  constructor() {
  }

  get msgAdjustGluc(): string {
    return $localize`Glukosewerte anpassen`;
  }

  get msgAdjustTarget(): string {
    return this._msgAdjustTarget(GLOBALS.fmtNumber(GLOBALS.user.hba1cAdjustFactor, 4));
  }

  get msgAdjustCalc(): string {
    return this._msgAdjustCalc(GLOBALS.fmtNumber(GLOBALS.user.adjustCalc, 1));
  }

  get msgAdjustLab(): string {
    return this._msgAdjustLab(GLOBALS.fmtNumber(GLOBALS.user.adjustLab, 1));
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  formatLabel(value: number) {
    return GLOBALS.fmtNumber(value, 1);
  }

  _msgAdjustTarget(factor: string): string {
    return $localize`:@@_msgAdjustTarget:Die Werte für BG_TARGET_BOTTOM und BG_TARGET_TOP wurden durch den Faktor ${factor} geteilt`;
  }

  _msgAdjustCalc(value: string): string {
    return $localize`:@@_msgAdjustCalc:Errechneter HbA1C: ${value}%`;
  }

  _msgAdjustLab(value: string): string {
    return $localize`:@@_msgAdjustLab:Im Labor ermittelter HbA1C: ${value}%`;
  }

  ngOnInit(): void {
  }

}
