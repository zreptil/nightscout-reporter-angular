import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';

export class PrintDailyGluc extends BasePrint {
  override help = $localize`:help for daygluc@@help-daygluc:Dieses Formular zeigt den Trend der Glukosewerte über den Tag hinweg
an. Dabei wird in der Spalte Trend immer angezeigt, um wieviel Prozent sich
der Wert von einer vollen Stunde zur nächsten verändert hat. Dieser Trend ist
ganz hilfreich, wenn man bei einem Basalratentest erkennen will, wie sich der
Glukosewert nur anhand der Basalrate entwickelt. Es kann auch eine Spalte für
die Boluswerte und die Kohlenhydrate angezeigt werden. Diese sollten aber bei
einem Basalratentest natürlich leer sein. Ebenso muss ein eventuell
vorhandener Loop im Zeitraum des Tests abgeschaltet sein. Es geht dabei nur
um den Diabetiker und seine Basalrate.\\nEs wird auch eine Spalte mit der
Basalrate angezeigt, wenn die Option 'Alle Werte für einen Tag anzeigen'
nicht markiert wurde. Wenn die Option markiert wurde, dann fehlt der Platz
(und auch der Sinn), diese darzustellen.`;
  override baseId = 'daygluc';
  override baseIdx = '12';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, PrintDailyGluc.msgParam1, {boolValue: true, thumbValue: false}),
  ];

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintDailyGluc`;
  }

  override get isLocalOnly(): boolean {
    return true;
  }

  override get title(): string {
    return $localize`PrintDailyGluc`;
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
