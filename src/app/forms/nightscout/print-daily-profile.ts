import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';

export class PrintDailyProfile extends BasePrint {
  override help = $localize`:help for dayprofile@@help-dayprofile:Dieses Formular zeigt die tatsächliche Basalrate, die während des Tages gelaufen ist unter
Berücksichtigung aller temporären Basalratenanpassungen. Zusätzlich kann noch die im Profil hinterlegte
Basalrate angezeigt werden. Die Basalrate kann als Wert, als prozentuale Änderung in Bezug auf die Profilbasalrate
oder mit beidem angezeigt werden. Die Summenspalte zeigt die bis zur entsprechenden Uhrzeit abgegebene Basalrate
an. Es ist auch möglich, die Uhrzeit mit Sekunden anzeigen zu lassen. Damit kann man die angezeigten Werte
rechnerisch überprüfen.

Wenn die Basalrate aus dem Profil angezeigt wird, wird das Maximum für die Darstellung der Balken anhand des
maximalen Wertes der Profilbasalrate ermittelt. Dadurch werden bei Werten über 100% des Maximalwerts der
Profilbasalrate die Balken über die Spalte hinaus verlängert. Es gibt aber eine Option, um diese Balken abzuschneiden
und als Pfeile darstellen zu lassen.`;
  override baseId = 'dayprofile';
  override baseIdx = '11';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, PrintDailyProfile.msgParam1, {boolValue: true, thumbValue: false}),
  ];

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintDailyProfile`;
  }

  override get isLocalOnly(): boolean {
    return true;
  }

  override get title(): string {
    return $localize`PrintDailyProfile`;
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
