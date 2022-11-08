import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';

export class PrintPercentile extends BasePrint {
  override help = $localize`:help for percentile@@help-percentile:Dieses Formular zeigt an, wie sich die Glukosewerte im ausgewählten Zeitraum über den Tag
verteilen. Diese Verteilung kann graphisch und tabellarisch ausgegeben werden.

In der Grafik sind die Bereiche für bestimmte Abweichungen farblich markiert. Die Linie zeigt den Medianwert
an. In der Tabelle kann man diese Werte nachlesen. Wenn die Basalrate mit ausgegeben wird, dann ist das die
Basalrate, die zu Beginn des ausgewählten Zeitraums aktiv war.`;
  override baseId = 'percentile';
  override baseIdx = '03';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, PrintPercentile.msgParam1, {boolValue: true, thumbValue: false}),
  ];

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintPercentile`;
  }

  override get isLocalOnly(): boolean {
    return true;
  }

  override get title(): string {
    return $localize`PrintPercentile`;
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
