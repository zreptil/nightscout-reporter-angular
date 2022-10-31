import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {DatepickerPeriod} from '@/_model/datepicker-period';
import {JsonData} from '@/_model/json-data';
import {Log} from '@/_services/log.service';

export class ShortcutData {
  name: string;
  pdfOrder: string;
  periodData: string;
  periodText: string;
  glucMGDLIdx: number;
  icon = 'attach_file';
  forms: { [key: string]: any } = {};

  constructor() {
    this.periodData = GLOBALS.period.toString();
    this.periodText = GLOBALS.period.display;
    this.glucMGDLIdx = GLOBALS.glucMGDLIdx;
    this.loadCurrentForms();
  }

  get formData(): string {
    return JSON.stringify(this.forms);
  }

  get isActive(): boolean {
    const check = JSON.stringify(GLOBALS.currentFormsAsMap);
    if (this.formData != check) {
      return false;
    }
    if (!this._isSamePeriod(this.periodData, GLOBALS.period.toString())) {
      return false;
    }
    // noinspection RedundantIfStatementJS
    if ((this.glucMGDLIdx ?? GLOBALS.glucMGDLIdx) != GLOBALS.glucMGDLIdx) {
      return false;
    }
    return true;
  }

  get copy(): ShortcutData {
    const ret = new ShortcutData();
    ret.name = this.name;
    ret.periodData = this.periodData;
    ret.periodText = this.periodText;
    ret.icon = this.icon;
    ret.pdfOrder = this.pdfOrder;
    ret.glucMGDLIdx = this.glucMGDLIdx;

    ret.forms = {};
    for (const key of Object.keys(this.forms)) {
      ret.forms[key] = this.forms[key];
    }
    return ret;
  }

// retrieve the data as a json-encoded-string
  get asJsonString(): string {
    return '{'
      + `"n":"${this.name}",`
      + `"p":"${this.periodData}",`
      + `"o":"${this.pdfOrder}",`
      + `"f":${this.formData},`
      + `"u":${this.glucMGDLIdx}`
      + '}';
  }

// creates an instance and fills it with data from a json-structure
  static fromJson(json: any): ShortcutData {
    const ret = new ShortcutData();
    try {
      ret.name = json.n;
      if (ret.name == 'null') {
        ret.name = null;
      }
      ret.periodData = json.p;
      ret.forms = json.f;
      const period = new DatepickerPeriod(ret.periodData);
      GlobalsData.updatePeriod(period);
      ret.periodText = period.display;
      ret.pdfOrder = json.o;
      ret.glucMGDLIdx = JsonData.toNumber(json.u, GLOBALS.glucMGDLIdx);
    } catch (ex) {
      Log.devError(ex, `Fehler bei ShortcutData.fromJson`);
    }
    return ret;
  }

  _isSamePeriod(a: string, b: string): boolean {
    const sa = a.split('|');
    const sb = b.split('|');
    if (sa.length < 5 || sb.length < 5 || sa[4] != sb[4]) {
      return false;
    }
    if (sa[2] == sb[2] && sa[2] != '') {
      return true;
    }
    // noinspection RedundantIfStatementJS
    if (sa[0] == sb[0] && sa[1] == sb[1]) {
      return true;
    }
    return false;
  }

// fills member forms with the forms that are currently selected
  loadCurrentForms(): void {
    this.forms = GLOBALS.currentFormsAsMap;
    this.pdfOrder = GLOBALS._pdfOrder;
  }
}
