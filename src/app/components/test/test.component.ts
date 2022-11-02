import {Component, OnInit} from '@angular/core';
import {Settings} from '@/_model/settings';
import {Log} from '@/_services/log.service';
import {PrintAnalysis} from '@/forms/nightscout/print-analysis';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {UserData} from '@/_model/nightscout/user-data';
import {ReportData} from '@/_model/report-data';
import {ThemeService} from '@/_services/theme.service';
import {SafeUrl} from '@angular/platform-browser';
import {BasePrint} from '@/forms/base-print';
import {DataService} from '@/_services/data.service';
import {PdfService} from '@/_services/pdf.service';
import {SessionService} from '@/_services/session.service';
import {ProgressService} from '@/_services/progress.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

  imgsrc: SafeUrl;
  srcList: BasePrint[];

  constructor(public ts: ThemeService,
              public ds: DataService,
              public pdf: PdfService,
              public ss: SessionService,
              public ps: ProgressService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  ngOnInit(): void {
  }

  testCrypt(): void {
    const src = localStorage.getItem(Settings.SharedData);
    const dst = Settings.doit(src);
    const chk = Settings.tiod(dst);
    if (chk !== src) {
      Log.error('TIOD funktioniert noch nicht');
      console.log('soll', src);
      console.log('ist', chk);
    } else {
      Log.info('TIOD funktioniert wie vorgesehen');
    }
  }

  testSettings(): void {
    this.ss.showSettings();
  }

  testPdf(): void {
    this.srcList = [new PrintAnalysis(this.pdf)];
    while (this.srcList.length < 1) {
      this.srcList.push(new PrintAnalysis(this.pdf));
      this.srcList[this.srcList.length - 1].isPortrait = Math.random() < 0.7;
    }
    for (const cfg of GLOBALS.listConfig) {
      cfg.checked = true;
    }
    this.generatePdf();

    // Log.debug('1');
    // this.ds.request('https://diamant.ns.10be.de/api/v1/devicestatus.json?find[created_at][$gte]=2022-10-24T22:00:00.000Z&find[created_at][$lte]=2022-10-25T21:59:59.999Z&count=100000'
    //   , {timeout: 1000}).then(result => {
    //   Log.debug('2');
    //   if (result?.body == null) {
    //     Log.error(result);
    //   } else {
    //     Log.debug(result.body);
    //   }
    // });
    this.ds.request('assets/img/nightscout.png', {options: {responseType: 'arraybuffer'}}).then(result => {
      console.log(result);
      this.imgsrc = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(result.body as any)))}`
    });
  }

  generatePdf() {
    GLOBALS.currPeriodShift = GLOBALS.listPeriodShift[0];
    GLOBALS.userList.push(new UserData());
    GLOBALS.ppHideNightscoutInPDF = false;
    const repData = new ReportData(new Date(), new Date());
    repData.user = GLOBALS.userList[0];
    this.pdf.generatePdf(true);
  }

  testDialog() {
    this.ss.confirm('To be or not to be').subscribe(result => {
      Log.info(`Da hast Du dann wohl ${result.btn} gedrückt`);
    });
  }
}
