import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';

export class PrintTemplate extends BasePrint {
  override help = $localize`:help for template@@help-template:Ein Template
  für weitere Formulare.`;
  override baseId = 'template';
  override baseIdx = '17';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, 'Parameter', {boolValue: false}),
  ];

  showParameter = false;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintTemplate`;
  }

  override get title(): string {
    return $localize`Template`;
  }

  override get isDebugOnly(): boolean {
    return true;
  }

  override get estimatePageCount(): any {
    return {count: 1, isEstimated: true};
  }

  override fillPages(pages: PageData[]): void {
    const oldLength = pages.length;
    if (this.showParameter) {
    }

    const page = new PageData(this.isPortrait, [this.headerFooter({skipFooter: true})]);
    pages.push(page);
    if (this.repData.isForThumbs && pages.length - oldLength > 1) {
      pages.splice(oldLength + 1, pages.length);
    }
  }

  override extractParams(): void {
    this.showParameter = this.params[0].boolValue;
  }
}
