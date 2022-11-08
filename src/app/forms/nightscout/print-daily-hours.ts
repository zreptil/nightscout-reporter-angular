import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';

export class PrintDailyHours extends BasePrint {
  override help = $localize`:help for dayhours@@help-dayhours:Dieses Formular zeigt eine Übersicht über die
Stunden der Tage des ausgewählten Zeitraums an. Die angezeigten Werte sind die
Mittelwerte der innerhalb der entsprechenden Stunde gemessenen Werte. Sie
werden anhand des ausgewählten Zielbereichs eingefärbt. In den Formularoptionen
kann man die Startstunde festlegen. Die Datumsspalte befindet sich immer links
von 0 Uhr und zeigt an, wo ein neuer Tag beginnt.`;
  override baseId = 'dayhours';
  override baseIdx = '13';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, PrintDailyHours.msgParam1, {boolValue: true, thumbValue: false}),
  ];

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintDailyHours`;
  }

  override get isLocalOnly(): boolean {
    return true;
  }

  override get title(): string {
    return $localize`PrintDailyHours`;
  }

  override get estimatePageCount(): any {
    return {count: 1, isEstimated: false};
  }

  override extractParams(): void {
    this.isFormParam1 = this.params[0].boolValue;
  }

  override fillPages(pages: PageData[]): void {
    pages.push(this.getPage());
    if (GLOBALS.showBothUnits) {
      GLOBALS.glucMGDLIdx = 1;
      pages.push(this.getPage());
      GLOBALS.glucMGDLIdx = 2;
    }
  }

  getPage(): PageData {
    this.titleInfo = this.titleInfoBegEnd();
    const data = this.repData.data;

    const ret = [
      this.headerFooter(),
    ];
    return new PageData(this.isPortrait, ret);
  }
}
