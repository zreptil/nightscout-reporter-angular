import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';

export class PrintDailyAnalysis extends BasePrint {
  override help = $localize`:help for dailyanalysis@@help-daily-analysis:Dieses Formular zeigt eine Übersicht für einen Tag. Hier
  werden die Tagesgrafik, die Basalrate, die Basalratenanpassungen, Insulin On
  Board und Carbs On Board angezeigt.`;
  override baseId = 'dayanalysis';
  override baseIdx = '06';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, PrintDailyAnalysis.msgParam1, {boolValue: true, thumbValue: false}),
  ];

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintDailyAnalysis`;
  }

  override get isLocalOnly(): boolean {
    return true;
  }

  override get title(): string {
    return $localize`PrintDailyAnalysis`;
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
