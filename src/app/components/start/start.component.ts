import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {ThemeService} from '@/_services/theme.service';
import {DataService} from '@/_services/data.service';
import {UserData} from '@/_model/nightscout/user-data';
import {ReportData} from '@/_model/report-data';
import {PdfService} from '@/_services/pdf.service';
import {PrintAnalysis} from '@/forms/nightscout/print-analysis';
import {FormConfig} from '@/forms/form-config';
import {Utils} from '@/classes/utils';
import {UrlData} from '@/_model/nightscout/url-data';
import {SafeUrl} from '@angular/platform-browser';
import {BasePrint} from '@/forms/base-print';
import {SessionService} from '@/_services/session.service';
import {Log} from '@/_services/log.service';
import {Settings} from '@/_model/settings';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {

  imgsrc: SafeUrl;
  srcList: BasePrint[];
  sendDisabled = true;

  constructor(public ts: ThemeService,
              public ds: DataService,
              public pdf: PdfService,
              public ss: SessionService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  async ngOnInit() {
    this.ds.loadWebData();
    await this.ts.setTheme(GLOBALS.theme);
    this.ds.onAfterLoad = this.afterLoad;
    const formList = [
      // new PrintTest(this.pdf),
      new PrintAnalysis(this.pdf),
      // new PrintProfile(this.pdf),
      // new PrintPercentile(this.pdf),
      // new PrintDailyStatistics(this.pdf),
      // new PrintDailyGraphic(this.pdf),
      // new PrintDailyAnalysis(this.pdf),
      // new PrintDailyLog(this.pdf),
      // new PrintWeeklyGraphic(this.pdf),
      // new PrintBasalrate(this.pdf),
      // new PrintCGP(this.pdf),
      // new PrintDailyProfile(this.pdf),
      // new PrintDailyGluc(this.pdf),
      // new PrintDailyHours(this.pdf),
      // new PrintUserData(this.pdf),
      // new PrintGlucDistribution(this.pdf)
    ];
    GLOBALS.listConfig = [];
    GLOBALS.listConfigOrg = [];
    for (const form of formList) {
      GLOBALS.listConfigOrg.push(new FormConfig(form, false));
    }
    Utils.pushAll(GLOBALS.listConfig, GLOBALS.listConfigOrg);

    this.ds.loadSettingsJson().then((_) => {
      let dlgId = GLOBALS.version == GLOBALS.lastVersion ? null : 'whatsnew';
      dlgId = GLOBALS.isConfigured ? dlgId : 'welcome';
      this.ss.showPopup(dlgId).subscribe(_ => {

      });
      /*
              // if (!GLOBALS.dsgvoAccepted) {
              //   _currPage = 'dsgvo';
              // }
              _lastPage = _currPage;
              GLOBALS.sortConfigs();
              for (var entry in GLOBALS.listConfig) {
                GLOBALS.user.formParams[entry.id] = entry.asString;
              }

              if (html.window.location.href.endsWith('?dsgvo')) currPage = 'dsgvo';
              if (html.window.location.href.endsWith('?impressum')) currPage = 'impressum';
              if (html.window.location.href.endsWith('?whatsnew')) currPage = 'whatsnew';
              if (html.window.location.href.endsWith('?welcome')) currPage = 'welcome';
              if (html.window.location.href.endsWith('?settings')) currPage = 'settings';

              try {
                GLOBALS.period.minDate = Date.parseLoose(GLOBALS.user.birthDate, GLOBALS.fmtDateForDisplay);
              } catch (ex) {
                GLOBALS.period.minDate = null;
              }
              GLOBALS.getCurrentGluc();
              if (_currPage == 'whatsnew') GLOBALS.saveWebData();
              checkPrint();
          //*/
    });
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

  test(): void {
    this.srcList = [new PrintAnalysis(this.pdf)];
    while (this.srcList.length < 1) {
      this.srcList.push(new PrintAnalysis(this.pdf));
      this.srcList[this.srcList.length - 1].isPortrait = Math.random() < 0.7;
    }
    GLOBALS.listConfig = [];
    GLOBALS.listConfigOrg = [];
    for (const form of this.srcList) {
      GLOBALS.listConfig.push(new FormConfig(form, true));
    }
    Utils.pushAll(GLOBALS.listConfig, GLOBALS.listConfigOrg);
    GlobalsData.user.name = 'ICH';
    GlobalsData.user.birthDate = '13.2.1965';
    GlobalsData.user.diaStartDate = '1.1.1996';
    GlobalsData.user.insulin = 'Novorapid';
    GlobalsData.user.listApiUrl = [];
    GlobalsData.user.listApiUrl.push(UrlData.fromJson({
      u: 'https://diamant.ns.10be.de',
      // 't': 'usertoken',
      sd: null,
      ed: null
    }));
    GlobalsData.user.customData = {};
    GlobalsData.user.formParams = {};
    GLOBALS.language.code = 'en-US';
    GLOBALS.loadLocalOnlySettings();
    this.ts.setTheme('standard');
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

  formFromId(id: string, suffix: string): BasePrint {
    switch (id) {
      // case '00':
      // case 'test':
      //   return PrintTest(suffix: suffix);
      case '01':
      case 'analysis':
        return new PrintAnalysis(this.pdf, suffix);
      // case '02':
      // case 'profile':
      //   return PrintProfile(suffix: suffix);
      // case '03':
      // case 'percentile':
      //   return PrintPercentile(suffix: suffix);
      // case '04':
      // case 'daystats':
      //   return PrintDailyStatistics(suffix: suffix);
      // case '05':
      // case 'daygraph':
      //   return PrintDailyGraphic(suffix: suffix);
      // case '06':
      // case 'dayanalysis':
      //   return PrintDailyAnalysis(suffix: suffix);
      // case '07':
      // case 'daylog':
      //   return PrintDailyLog(suffix: suffix);
      // case '08':
      // case 'weekgraph':
      //   return PrintWeeklyGraphic(suffix: suffix);
      // case '09':
      // case 'basal':
      //   return PrintBasalrate(suffix: suffix);
      // case '10':
      // case 'cgp':
      //   return PrintCGP(suffix: suffix);
      // case '11':
      // case 'dayprofile':
      //   return PrintDailyProfile(suffix: suffix);
      // case '12':
      // case 'daygluc':
      //   return PrintDailyGluc(suffix: suffix);
      // case '13':
      // case 'dayhours':
      //   return PrintDailyHours(suffix: suffix);
      // case '14':
      // case 'userdata':
      //   return PrintUserData(suffix: suffix);
      // case '15':
      // case 'glucdist':
      //   return PrintGlucDistribution(suffix: suffix);
    }
    Log.debug('StartComponent.fromFormId ist noch nicht vollständig implementiert');
    return null;
  }

  afterLoad(): void {
    if (GLOBALS.pdfOrder.length >= 48) {
      for (let i = 0; i < GLOBALS.pdfOrder.length; i += 3) {
        const idx = GLOBALS.pdfOrder.substring(i, i + 3);
        const cfg = GLOBALS.listConfig.find((e) => e.idx == idx);
        if (cfg == null) {
          const form = this.formFromId(idx.substring(0, 2), idx.substring(2));
          if (form != null) {
            const newCfg = new FormConfig(form, false);
            GLOBALS.listConfig.push(newCfg);
          }
        }
      }
      GLOBALS.listConfigOrg = [];
      Utils.pushAll(GLOBALS.listConfigOrg, GLOBALS.listConfig);
    }
    this.checkPrint();
  }

  checkPrint(): void {
    this.sendDisabled = true;
    if (GLOBALS.period.isEmpty) {
      return;
    }
    for (const cfg of GLOBALS.listConfig) {
      if (cfg.checked) {
        if (cfg.form.isDebugOnly) {
          if (GLOBALS.isDebug) {
            this.sendDisabled = false;
          }
        } else if (cfg.form.isLocalOnly) {
          if (GLOBALS.isLocal) {
            this.sendDisabled = false;
          }
        } else {
          this.sendDisabled = false;
        }
      }
    }

    setTimeout(() => {
      Log.debug('Die Dragmethode in StartComponent.checkPrint ist noch nicht vollständig implementiert');
      /*
            if (this._drag != null) {
              this._drag.onDragEnd.listen(null);
              this._drag.onDragStart.listen(null);
              this._drag.destroy();
            }

            _drag = Draggable(html.querySelectorAll('.sortable'),
              avatarHandler: g.viewType == 'tile' ? TileAvatarHandler() : AvatarHandler.clone(),
              draggingClass: 'dragging',
              handle: g.viewType == 'tile' ? null : '[name]>material-icon',
              verticalOnly: g.viewType == 'list');
            _drag.onDragStart.listen((DraggableEvent event) {});
            _drag.onDragEnd.listen((DraggableEvent event) {
              event.draggableElement.animate([
                {'transform': 'rotate(180)'}
              ], 500);
            });
            if (_drop != null) _drop.onDrop.listen(null);
            _drop = Dropzone(html.querySelectorAll('.sortable'), overClass: 'dragover');
            _drop.onDrop.listen((DropzoneEvent event) {
              if (!dropElement(event.draggableElement, event.dropzoneElement)) {
                event.dropzoneElement.attributes['dontclick'] = 'true';
              }
            });
      */
    }, 100);
  }

  /*
        bool dropElement(html.Element drag, html.Element drop) {
          var dragId = drag.getAttribute('id').substring(5);
          var dropId = drop.getAttribute('id').substring(5);
          if (dragId == dropId) return false;

          FormConfig dragCfg;
          var dragIdx = -1;
          var dropIdx = -1;
          for (var i = 0; i < g.listConfig.length; i++) {
            if (g.listConfig[i].id == dragId) {
              dragCfg = g.listConfig[i];
              dragIdx = i;
            }
            if (g.listConfig[i].id == dropId) dropIdx = i;
          }
          if (dragCfg != null && dropIdx >= 0) {
            g.listConfig.removeAt(dragIdx);
            g.listConfig.insert(dragIdx < dropIdx ? dropIdx - 1 : dropIdx, dragCfg);
          }
          g.savePdfOrder();
          return true;
        }

        Draggable _drag;
        Dropzone _drop;
        String msgModelName = Intl.message('Max Mustermann', desc: 'modelname used in images on tiles');

        ReportData reportData;

        bool checkCfg(var cfg) => cfg.checked && (!cfg.form.isDebugOnly || g.isDebug) && (!cfg.form.isLocalOnly || g.isLocal);

        void clickMenuButton(String type) {
          drawerVisible = false;
          switch (type) {
            case 'facebook':
              navigate('https://www.facebook.com/nightrep');
              break;
            case 'autotune':
              navigate('https://autotuneweb.azurewebsites.net/');
              break;
            case 'translate':
              navigate('https://translate.google.com/toolkit/');
              break;
            case 'jsonparser':
              navigate('https://jsonformatter.org/json-parser');
              break;
            case 'nswatch':
              navigate('?watch');
              break;
            case 'nsreports':
              callNightscoutReports();
              break;
            case 'nightscout':
              callNightscout();
              break;
            case 'whatsnew':
              currPage = 'whatsnew';
              break;
            case 'nightscoutstatus':
              callNightscoutStatus();
              break;
            case 'menu':
              changeView();
              break;
            case 'settings':
              g.save();
              currPage = 'settings';
              break;
          }
        }
      */
}
