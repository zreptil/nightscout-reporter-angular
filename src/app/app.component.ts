import {Component} from '@angular/core';
import {PdfService} from './_services/pdf.service';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {PrintAnalysis} from '@/forms/nightscout/print-analysis';
import {GLOBALS} from '@/_model/globals-data';
import {ReportData} from '@/_model/report-data';
import {UserData} from '@/_model/nightscout/user-data';
import {Log, LogService} from '@/_services/log.service';
import {FormConfig} from '@/forms/form-config';
import {BasePrint} from '@/forms/base-print';
import {Utils} from '@/classes/utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'nightscout-reporter';
  imgsrc: SafeUrl;
  debug: any;
  srcList: BasePrint[];

  constructor(public http: HttpClient,
              private pdfService: PdfService,
              public sanitizer: DomSanitizer) {
    LogService.instance = new LogService(false);
    this.srcList = [new PrintAnalysis(pdfService), new PrintAnalysis(pdfService), new PrintAnalysis(pdfService), new PrintAnalysis(pdfService), new PrintAnalysis(pdfService)];
    this.srcList[1].isPortrait = false;
    this.srcList[2].isPortrait = false;
    this.srcList[4].isPortrait = false;
    GLOBALS.listConfig = [];
    GLOBALS.listConfigOrg = [];
    for (const form of this.srcList) {
      GLOBALS.listConfigOrg.push(new FormConfig(form, true));
    }
    Utils.pushAll(GLOBALS.listConfig, GLOBALS.listConfigOrg);
    this.generatePdf();
  }

  get log(): LogService {
    return Log;
  }

  generatePdf() {
    GLOBALS.currPeriodShift = GLOBALS.listPeriodShift[0];
    GLOBALS.userList.push(new UserData());
    GLOBALS.ppHideNightscoutInPDF = false;
    const repData = new ReportData(new Date(), new Date());
    repData.user = GLOBALS.userList[0];
    this.pdfService.generatePdf(repData);
  }
}
