import {Component, OnInit} from '@angular/core';
import {Settings} from '@/_model/settings';
import {Log} from '@/_services/log.service';
import {PrintAnalysis} from '@/forms/nightscout/print-analysis';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {ThemeService} from '@/_services/theme.service';
import {SafeUrl} from '@angular/platform-browser';
import {BasePrint} from '@/forms/base-print';
import {DataService} from '@/_services/data.service';
import {PdfService} from '@/_services/pdf.service';
import {SessionService} from '@/_services/session.service';
import {ProgressService} from '@/_services/progress.service';
import {MessageService} from '@/_services/message.service';
import {Utils} from '@/classes/utils';
import {NightscoutService} from '@/_services/nightscout.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
  standalone: false
})
export class TestComponent implements OnInit {

  imgsrc: SafeUrl;
  srcList: BasePrint[];
  start: Date;

  constructor(public ts: ThemeService,
              public ds: DataService,
              public pdf: PdfService,
              public ns: NightscoutService,
              public ss: SessionService,
              public ms: MessageService,
              public ps: ProgressService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  ngOnInit(): void {
    this.ss.initialLoad();
    const notes = 'Oleole, supernotitz -2738 und 09123 und 972131';
    //const notes = 'The quick brown fox jumps over the lazy dog. It barked.';
    //const rex = /(?<wurscht>fox|cat) jumps over/;
    const rex = /[^0-9\-]*(?<eCarbs>-*\d*)[^0-9\-]*(?<egal>-*\d*)[^0-9\-]*(?<delay>-*\d*).*/;
    const matches = notes.match(rex);
    Log.info('match', notes, matches, matches.groups);
    console.log(notes, matches);
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
    GLOBALS.ppHideNightscoutInPDF = false;
    // this.ns.reportData = new ReportData(new Date(), new Date());
    // this.ns.reportData.user = new UserData();
    // this.ns.reportData.user.listApiUrl = [new UrlData()];
    // this.ns.reportData.user.listApiUrl[0].url = 'https://diamant.ns.10be.de';
    // this.ns.reportData.user.listApiUrl[0].startDate = new Date(1900, 0, 1);
    this.pdf.generatePdf(false);
  }

  testDialog() {
    this.ms.confirm('To be or not to be').subscribe(result => {
      Log.info(`Da hast Du dann wohl ${result.btn} gedrückt`);
    });
  }

  clickProgress(mayCancel: boolean) {
    this.ps.text = 'Hier sieht man den Fortschritt...';
    this.ps.max = 400;
    this.ps.value = 270;
    this.ps.init({
      progressPanelBack: 'maroon',
      progressPanelFore: 'rgba(255, 255, 255, 0.9)',
      progressBarColor: '#d00'
    }, mayCancel);
    if (!mayCancel) {
      this.start = new Date();
      this.ps.value = 0;
      this.ps.max = 5;
      this.doProgress();
    }
  }

  doProgress(): void {
    const now = new Date();
    if (Utils.differenceInSeconds(now, this.start) <= this.ps.max) {
      this.ps.value = Utils.differenceInSeconds(now, this.start);
      this.ps.text = `${Utils.plural(this.ps.max - Utils.differenceInSeconds(now, this.start), {
        0: 'Das wars!',
        1: 'Nur noch 1 Sekunde',
        other: `Noch @count@ Sekunden`
      })}`;
      setTimeout(() => this.doProgress(), 100);
    } else {
      this.ps.cancel();
    }
  }
}
