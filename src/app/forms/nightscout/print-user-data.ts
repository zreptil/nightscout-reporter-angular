import {BasePrint, DataNeeded} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {UserData} from '@/_model/nightscout/user-data';
import {Settings} from '@/_model/settings';
import {UrlData} from '@/_model/nightscout/url-data';
import {DataService} from '@/_services/data.service';
import {Utils} from '@/classes/utils';

export class PrintUserData extends BasePrint {
  override help = $localize`:help for userdata@@help-userdata:`;
  override baseId = 'userdata';
  override baseIdx = '14';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, this.msgParam1, {boolValue: true})
  ];
  override needed = new DataNeeded(true, true, false, true);
  msgName = $localize`Name`;
  msgVersion = $localize`Version`;
  msgUnits = $localize`Einheiten`;
  msgLastGluc = $localize`Letzter Glukosewert`;
  msgLastTreatment = $localize`Letzter Behandlungswert`;

  constructor(ps: PdfService, public ds: DataService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  override get isLocalOnly(): boolean {
    return true;
  }

  _title = $localize`Benutzerdaten`;

  override get title(): string {
    return this._title;
  }

  override get estimatePageCount(): any {
    const count = this.needed.status.anybody ? GLOBALS.userList?.length ?? 0 : 1;
    return {count: count, isEstimated: false};
  }

  override get isPortrait(): boolean {
    return true;
  }

  get msgNoData(): string {
    return $localize`Es sind keine Daten vorhanden.`;
  }

  get msgParam1(): string {
    return $localize`Alle Benutzer ausgeben`;
  }

  override extractParams(): void {
    this.needed.status.anybody = this.params[0].boolValue;
    this.needed.data.anybody = this.params[0].boolValue;
  }

  override fillPages(pages: PageData[]): void {
    if (this.repData.isForThumbs) {
      this.getPage(this.repData.user, pages);
      return;
    }

    for (const user of GLOBALS.userList) {
      if (this.needed.status.anybody || user == GLOBALS.user) {
        this.getPage(user, pages);
      }
    }
  }

  getPage(user: UserData, pages: PageData[]): void {
    this._title = user.name;
    this.subtitle = '';
    const pos = this.title.indexOf('(');
    if (pos > 0) {
      this.subtitle = this.title.substring(pos + 1, this.title.length - 1);
      this._title = this.title.substring(0, pos - 1);
    }
    this.titleInfo = user.apiUrl(null, '', {noApi: true});

    if (!user.isReachable || (user.status?.status ?? '401') == '401') {
      pages.push(this.getEmptyForm(this.isPortrait, user.status?.status ?? '401', {skipFooter: true}));
      return;
    }

    const table: any[] = [];

    const x = this.xframe;
    const y = this.yorg - 0.5;
    const ret: any[] = [
      this.headerFooter({skipFooter: true}),
      {
        absolutePosition: {x: this.cm(x), y: this.cm(y)},
        layout: 'noBorders',
        table: {
          widths: [this.cm(3.0), this.cm(this.width - 3.0 - 2 * this.xframe)],
          body: table
        }
      }
    ];

    if (user.status == null) {
      table.push([
        {text: this.msgNoData, colSpan: '2', color: 'red'}
      ]);
      pages.push(new PageData(this.isPortrait, ret));
      return;
    }

    const fsTitle = this.fs(8);
    const fsData = this.fs(10);

    const txtLastGluc = `${this.repData.data.entries.length}`;
    const txtLastTreatment = `${this.repData.data.treatments.length}`;

    table.push([
      {text: this.msgName, fontSize: fsTitle},
      {text: `${user.status.name}`, fontSize: fsData}
    ]);
    table.push([
      {text: this.msgVersion, fontSize: fsTitle},
      {text: `${user.status.version}`, fontSize: fsData}
    ]);
    const units =
      GLOBALS.isMGDL(user.status) ? Settings.msgUnitMGDL : Settings.msgUnitMMOL;
    table.push([
      {text: this.msgUnits, fontSize: fsTitle},
      {text: units, fontSize: fsData}
    ]);
    table.push([
      {text: 'Enabled', fontSize: fsTitle},
      {text: `${user.status.settings.enable}`, fontSize: fsData}
    ]);
    table.push([
      {text: this.msgOwnLimits, fontSize: fsTitle},
      {
        text: `${this.glucFromData(user, user.status.settings.bgTargetBottom ?? 0)} ${units} - ${this.glucFromData(user, user.status.settings.bgTargetTop ?? 0)} ${units}`,
        fontSize: fsData
      }
    ]);
    table.push([
      {text: this.msgLastGluc, fontSize: fsTitle},
      {text: txtLastGluc, fontSize: fsData}
    ]);
    table.push([
      {text: this.msgLastTreatment, fontSize: fsTitle},
      {text: txtLastTreatment, fontSize: fsData}
    ]);

    pages.push(new PageData(this.isPortrait, ret));
  }

  glucFromData(user: UserData, value: number): string {
    if (!GLOBALS.isMGDL(user.status)) {
      return GLOBALS.fmtNumber(value / 18.02, 1);
    }
    return GLOBALS.fmtNumber(value, 0);
  }

  override async loadUserData(user: UserData) {
    let lastEntry: any = null;
    for (const url of user.listApiUrl) {
      const check = this.calculateFirstDay(url, 'entries');
      if (check != null) {
        if (lastEntry == null) {
          lastEntry = check;
        }
      }
    }
// print('lastEntry');
// print(convert.jsonDecode(lastEntry));
  }

  async calculateFirstDay(urlData: UrlData, type: string) {
    let done: boolean;
    let calcDate = urlData.startDate;
    let diff = 256;
    done = false;
    let ret = null;
    while (!done) {
      const check = new Date(calcDate.getFullYear(), calcDate.getMonth(), calcDate.getDay(), 23, 59, 59, 999);
      const url = urlData.fullUrl(`${type}.json`, `find[date][$gte]=${check.getTime()}&count=2`);
      const json = await this.ds.request(url, {asJson: true});
      try {
        if (diff > 1) {
          if (json.length < 1) {
            diff = -Math.floor(diff / 2);
          }
        } else if (diff < -1) {
          if (json.length > 0) {
            diff = -Math.floor(diff / 2);
          }
        } else {
          done = true;
          if (Utils.isOnOrAfter(calcDate, Utils.addDateDays(GlobalsData.now, -1))) {
            calcDate = GlobalsData.now;
          } else if (json.length < 1) {
            calcDate = Utils.addDateDays(calcDate, -diff);
          }
        }
        ret = json;
      } catch (ex) {
        done = true;
      }

      if (!done) {
        calcDate = Utils.addDateDays(calcDate, diff);
      }
    }
    // if (calcDate.isOnOrAfter(Date.today())) {
    //   urlData.endDate = null;
    // } else {
    //   urlData.endDate = calcDate;
    // }
    return ret;
  }
}
