import {GlobalsData} from '@/_model/globals-data';

export class UserData {
  adjustTarget: boolean = false;
  adjustCalc = 5.0;
  adjustLab = 5.0;

  constructor(public g: GlobalsData) {

  }

  _adjustGluc: boolean = false;

  get adjustGluc(): boolean {
    return this._adjustGluc;
  }

  set adjustGluc(value: boolean) {
    this._adjustGluc = value;
    if (this._adjustGluc) {
      GlobalsData.adjustFactor = this.hba1cAdjustFactor;
    } else {
      GlobalsData.adjustFactor = 1.0;
    }
  }

  get hba1cAdjustFactor(): number {
    return (this.adjustLab * 28.7 - 46.7) / (this.adjustCalc * 28.7 - 46.7);
  }
}
