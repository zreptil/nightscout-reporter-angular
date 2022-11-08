import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';

export class PrintDailyGraphic extends BasePrint {
  override help = $localize`:help for daygraph@@help-daygraph:Dieses Formular zeigt den Verlauf der Glukosekurve für einen Tag. Pro Tag im ausgewählten
Zeitraum wird eine Seite erzeugt. Es gibt sehr viele Optionen, mit denen dieses Formular angepasst werden kann.
Die Optionen, die auf einen Loop hinweisen sind andersfarbig markiert, um sie schneller identifizieren zu
können. Die Optionen COB und IOB verlangsamen die Ausgabe teilweise erheblich, weshalb man diese nur dann
verwenden sollte, wenn sie wirklich von Interesse sind.

Unter der Grafik kann die Basalrate angezeigt werden. Ein laufender Loop wird diese immer wieder hoch und runter
setzen. Deshalb kann man sowohl die tatsächliche Basalrate als auch die im Profil eingestellte Basalrate
anzeigen lassen. Für die Basalrate gibt es noch die Formulare @09@, @11@ und @02@, auf denen man sie genauer
analysieren kann. Man kann auch das @10@ für den Tag erzeugen lassen. Das wird dann auf einer neuen Seite ausgegeben.

Dieses Formular ist eines der seitenintensivsten Formulare in Nightscout Reporter. Deshalb gibt es hier
die Möglichkeit, mehrere Tagesgrafiken auf einer Seite ausgeben zu lassen. Darunter leidet natürlich die Lesbarkeit,
aber für einen Überblick über den Verlauf ist das ganz nützlich.`;
  override baseId = 'daygraph';
  override baseIdx = '05';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, PrintDailyGraphic.msgParam1, {boolValue: true, thumbValue: false}),
  ];

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintDailyGraphic`;
  }

  override get isLocalOnly(): boolean {
    return true;
  }

  override get title(): string {
    return $localize`PrintDailyGraphic`;
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
