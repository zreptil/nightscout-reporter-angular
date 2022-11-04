import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {ThemeService} from '@/_services/theme.service';
import {DataService} from '@/_services/data.service';
import {PdfService} from '@/_services/pdf.service';
import {PrintAnalysis} from '@/forms/nightscout/print-analysis';
import {FormConfig} from '@/forms/form-config';
import {Utils} from '@/classes/utils';
import {SessionService} from '@/_services/session.service';
import {Log} from '@/_services/log.service';
import {ProgressService} from '@/_services/progress.service';
import {UserData} from '@/_model/nightscout/user-data';
import {NightscoutService} from '@/_services/nightscout.service';
import {ShortcutData} from '@/_model/shortcut-data';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  sendDisabled = true;
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
          this.ds.savePdfOrder();
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
  sendIcon = 'send';
  menuIdx = 0;
  currShortcutIdx = -1;
  currShortcut: ShortcutData;

  constructor(public ts: ThemeService,
              public ds: DataService,
              public pdf: PdfService,
              public ss: SessionService,
              public ps: ProgressService,
              public ns: NightscoutService) {
    // setTimeout(() => this.ss.showPopup('all').subscribe(_ => {
    //
    // }), 1000);
  }

  get msgAddText(): string {
    return $localize`Hinzufügen`;
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get createIcon(): string {
    return GLOBALS.isDebug ? 'vertical_align_bottom' : this.sendIcon;
  }

  get classForHeader(): string[] {
    const ret = ['mat-elevation-z4'];
    if (GLOBALS.isDebug) {
      ret.push('debug');
    }
    return ret;
  }

  get drawerClass(): string[] {
    const ret = ['material-drawer-button'];
    switch (this.menuIdx) {
      case 0:
        ret.push('icon-menu');
        break;
      case 1:
        ret.push('icon-shortcut');
        break;
    }
    return ret;
  }

  get msgImpressum(): string {
    return $localize`Impressum`;
  }

  get msgDSGVO(): string {
    return $localize`Datenschutzerklärung`;
  }

  activateShortcut(shortcutIdx: number): void {
    if (shortcutIdx != null) {
      const data = GLOBALS.shortcutList[shortcutIdx];
      this.ss.fillFormsFromShortcut(data);
      this.checkPrint();
      this.ds._initAfterLoad();
    }
  }

  shortcutClass(data: ShortcutData): string[] {
    const ret = ['shortcut'];
    if (data.isActive) {
      ret.push('active');
    }
    return ret;
  }

  editShortcut(shortcutIdx: number): void {
    this.currShortcutIdx = shortcutIdx;
    if (shortcutIdx >= 0 && shortcutIdx < GLOBALS.shortcutList.length) {
      this.currShortcut = GLOBALS.shortcutList[shortcutIdx].copy;
    } else {
      this.currShortcut = new ShortcutData();
    }
    this.ss.showPopup('shortcutedit');
  }

  sendClass(shift: number, ret: string): string {
    if (ret !== 'stop' &&
      this.ns.reportData != null &&
      GLOBALS.period.shiftStartBy(shift) == this.ns.reportData.begDate &&
      GLOBALS.period.shiftEndBy(shift) == this.ns.reportData.endDate) {
      ret = `${ret} sendMarked`;
    }
    return ret;
  }

  clickSend() {
    switch (this.sendIcon) {
      case 'send':
        this.ss.showPopup('outputparams').subscribe(_ => {

        });
        break;
      case 'close':
        this.sendIcon = 'send';
        break;
    }
  }

  classForView(def: string): string[] {
    const ret = [def];
    if (def === 'footer' && this.ps.progressText != null) {
      return ret;
    }
    switch (GLOBALS.viewType) {
      case 'tile':
        ret.push('is-tileview');
        break;
    }

    return ret;
  }

  userClass(user: UserData): string[] {
    const ret = ['selectItem'];
    if (!user.isReachable) {
      ret.push('unreachable');
    }
    return ret;
  }

  activateUser(idx: number): void {
    GLOBALS.userIdx = idx;
    this.ns.reportData = null;
    this.ds.save();
    this.ds.getCurrentGluc();
    this.checkPrint();
    this.ds._initAfterLoad();
  }

  clickLocalTitle() {
    GLOBALS.isLocal = !GLOBALS.isLocal;
    this.checkPrint();
  }

  async ngOnInit() {
    this.ds.loadWebData();
    await this.ts.setTheme(GLOBALS.theme);
    this.ds.onAfterLoad = this.afterLoad.bind(this);
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
      // if (!GLOBALS.dsgvoAccepted) {
      //   _currPage = 'dsgvo';
      // }
      // _lastPage = _currPage;
      this.ds.sortConfigs();
      for (const entry of GLOBALS.listConfig) {
        GLOBALS.user.formParams[entry.id] = entry.asString;
      }
      Log.todo('In MainComponent prüfen, ob die weiterleitung an bestimmte Seiten noch notwendig ist');
      // if (html.window.location.href.endsWith('?dsgvo')) currPage = 'dsgvo';
      // if (html.window.location.href.endsWith('?impressum')) currPage = 'impressum';
      // if (html.window.location.href.endsWith('?whatsnew')) currPage = 'whatsnew';
      // if (html.window.location.href.endsWith('?welcome')) currPage = 'welcome';
      // if (html.window.location.href.endsWith('?settings')) currPage = 'settings';

      /*

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

  afterLoad(): void {
    for (let i = 0; i < GLOBALS.pdfOrder.length; i += 3) {
      const idx = GLOBALS.pdfOrder.substring(i, i + 3);
      const cfg = GLOBALS.listConfig.find((e) => e.idx == idx);
      if (cfg == null) {
        const form = this.ss.formFromId(idx.substring(0, 2), idx.substring(2));
        if (form != null) {
          const newCfg = new FormConfig(form, false);
          GLOBALS.listConfig.push(newCfg);
        }
      }
    }
    GLOBALS.listConfigOrg = [];
    Utils.pushAll(GLOBALS.listConfigOrg, GLOBALS.listConfig);
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
      Log.todo('Die Dragmethode in StartComponent.checkPrint ist noch nicht vollständig implementiert');
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

  clickMenuButton(type: string) {
    switch (type) {
      case 'facebook':
        this.ss.navigate('https://www.facebook.com/nightrep');
        break;
      case 'autotune':
        this.ss.navigate('https://autotuneweb.azurewebsites.net/');
        break;
      case 'translate':
        this.ss.navigate('https://translate.google.com/toolkit/');
        break;
      case 'jsonparser':
        this.ss.navigate('https://jsonformatter.org/json-parser');
        break;
      case 'nswatch':
        this.ss.navigate('#watch');
        break;
      case 'nsreports':
        this.ss.navigate(GLOBALS.user.reportUrl);
        break;
      case 'nightscout':
        this.ss.navigate(GLOBALS.user.apiUrl(null, '', {noApi: true}));
        break;
      case 'nightscoutstatus':
        this.ss.navigate('https://nielsmaerten.github.io/nightscout-assistant/#/${g.language.img}/home');
        break;
      case 'menu':
        this.changeView();
        break;
      case 'dart':
        window.location.href = '#dart';
        break;
    }
  }

  changeView(): void {
    switch (GLOBALS.viewType) {
      case 'list':
        GLOBALS.viewType = 'tile';
        break;
      case 'tile':
        GLOBALS.viewType = 'list';
        break;
    }
    this.ds.save();
    this.checkPrint();
  }

  getDrawerButtonClass(menu: number): string[] {
    const ret = [];
    switch (menu) {
      case 0:
        ret.push('menu-button');
        break;
      case 1:
        ret.push('shortcut-button');
        break;
    }

    return ret;
  }

  getDrawerClass(menu: number): string[] {
    const ret = [];
    switch (menu) {
      case 0:
        ret.push('menu-root');
        break;
      case 1:
        ret.push('shortcut-root');
        break;
    }

    if (menu != this.menuIdx) {
      ret.push('hidden');
    }

    return ret;
  }

  clickDebugTrigger() {
    this.ns.reportData = null;
    GLOBALS.isDebug = !GLOBALS.isDebug;
    this.checkPrint();
  }
}
