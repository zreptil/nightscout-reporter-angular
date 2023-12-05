import {Injectable} from '@angular/core';
import {DataService} from '@/_services/data.service';
import {MaterialColorService} from '@/_services/material-color.service';
import {Utils} from '@/classes/utils';
import {GLOBALS} from '@/_model/globals-data';
import * as JSZip from 'jszip';
import {encode} from 'base64-arraybuffer';
import {Log} from '@/_services/log.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  static lsThemeName = 'owntheme';
  readonly currTheme: any = {};
  langHeight = '16em';

  colorNames: any = {
    mainHead: $localize`mainHead`,
    mainBody: $localize`mainBodyBack`,
    debugFirst: $localize`debugFirst`,
    debugSecond: $localize`debugSecond`,
    debug: $localize`debug`,
    settingsHead: $localize`settingsHeadBack`,
    settingsBody: $localize`settingsBodyBack`,
    settingsScrollThumb: $localize`settingsScrollThumb`,
    settingsError: $localize`settingsError`,
    legalHead: $localize`legalHeadBack`,
    legalBody: $localize`legalBodyBack`,
    legalScrollThumb: $localize`legalScrollThumb`,
    legalLink: $localize`legalLink`,
    whatsnewHead: $localize`whatsnewHeadBack`,
    whatsnewBody: $localize`whatsnewBodyBack`,
    whatsnewScrollThumb: $localize`whatsnewScrollThumb`,
    whatsnewLink: $localize`whatsnewLink`,
    local: $localize`localFore`,
    beta: $localize`betaFore`,
    pdfBtn: $localize`pdfBtnBack`,
    pdfInfo: $localize`pdfInfoFore`,
    sendMarked: $localize`sendMarked`,
    googleSignedout: $localize`googleSignedout`,
    loopMarked: $localize`loopMarked`,
    outputparamsHead: $localize`outputparamsHeadBack`,
    outputparamsBody: $localize`outputparamsBody`,
    printparamsScrollThumb: $localize`printparamsScrollThumb`,
    shortcutHead: $localize`shortcutHeadBack`,
    shortcutBody: $localize`shortcutBodyBack`,
    shortcutScrollThumb: $localize`shortcutScrollThumb`,
    helpHead: $localize`helpHeadBack`,
    helpBody: $localize`helpBodyBack`,
    helpScrollThumb: $localize`helpScrollThumb`,
    infoHead: $localize`infoHeadBack`,
    infoBody: $localize`infoBodyBack`,
    infoWarningColor: $localize`infoWarningColor`,
    infoErrorColor: $localize`infoErrorColor`,
    infoInfoColor: $localize`infoInfoColor`,
    infoScrollThumb: $localize`infoScrollThumb`,
    glucLow: $localize`glucLow`,
    glucNormLow: $localize`glucNormLow`,
    glucNorm: $localize`glucNorm`,
    glucNormHigh: $localize`glucNormHigh`,
    glucHigh: $localize`glucHigh`,
    datepickerBtnEmpty: $localize`datepickerBtnEmptyBack`,
    datepickerHeadEmpty: $localize`datepickerHeadEmptyBack`,
    datepickerHead: $localize`datepickerHeadBack`,
    datepickerBody: $localize`datepickerBodyBack`,
    datepickerMonthTitle: $localize`datepickerMonthTitleBack`,
    datepickerMonth: $localize`datepickerMonthBack`,
    datepickerBtnRaised: $localize`datepickerBtnRaisedBack`,
    datepickerBtnRaisedKey: $localize`datepickerBtnRaisedKeyBack`,
    datepickerBtnShiftKey: $localize`datepickerBtnShiftKeyBack`,
    datepickerDowActive: $localize`datepickerDowActiveBack`,
    datepickerDowInactive: $localize`datepickerDowInactiveBack`,
    sendCount: $localize`sendCountFore`,
    sendCountFrame: $localize`sendCountFrame`,
    userPin: $localize`userPinFore`,
    logDebugColor: $localize`logDebugColor`,
    logDebug: $localize`logDebugFore`,
    owlBody: $localize`owlBody`,
    owlBrow: $localize`owlBrow`,
    owlBodyLeft: $localize`owlBodyLeft`,
    owlBodyRight: $localize`owlBodyRight`,
    owlEyearea: $localize`owlEyearea`,
    owlEyes: $localize`owlEyes`,
    owlXmasFrame: $localize`owlXmasFrame`,
    owlXmasFur: $localize`owlXmasFur`,
    owlXmasFabric: $localize`owlXmasFabric`,
    owlWizardFabric: $localize`owlWizardFabric`,
    owlWizardStar2: $localize`owlWizardStar2`,
    owlWizardStar1: $localize`owlWizardStar1`,
    owlReporterFrame: $localize`owlReporterFrame`,
    owlReporterFabric: $localize`owlReporterFabric`,
    owlOwnFabric: $localize`owlOwnFabric`,
    owlOwnBeard: $localize`owlOwnBeard`,
    owlOwnFrame: $localize`owlOwnFrame`
  };

  constructor(public ds: DataService,
              public ms: MaterialColorService) {
    window.addEventListener('resize', this.onResize);
    console.log(this.themeWidth);
    this.onResize();
  }

  get themeWidth(): string {
    let ret = 6 + 2.4 * Object.keys(GLOBALS.themeList).length;
    if (Log.mayDebug) {
      ret += 2;
    }
    if (GLOBALS.editColors) {
      ret += 2;
    }
    return `${ret}em`
  }

  get isWatch(): boolean {
    return window.location.href.indexOf('watch') > 0;
  }

  restoreTheme(): void {
    const t = GLOBALS.ownTheme;
    if (t != null) {
      const zip = new JSZip();
      zip.loadAsync(t, {base64: true}).then(packed => {
        packed.file('t').async('string').then(theme => {
          const src = JSON.parse(theme);
          for (const key of Object.keys(src)) {
            this.currTheme[key] = src[key];
          }
          this.assignStyle(document.body.style, this.currTheme);
          // console.log(JSON.parse(ex));
        });
      });
    }
  }

  storeTheme(): void {
    const list = Object.keys(this.currTheme);
    list.sort();
    let src: any = {};
    for (const key of list) {
      if (this.currTheme[key] != null) {
        src[key] = this.currTheme[key];
      }
    }
    src = JSON.stringify(src);
    const zip = new JSZip();
    zip.file('t', src);
    zip.generateAsync({type: 'blob', compression: 'DEFLATE'}).then(blob => {
      blob.arrayBuffer().then(buffer => {
        GLOBALS.ownTheme = encode(buffer);
        this.ds.saveWebData();
      });
      // saveAs(content, 'colors.zip');
    });
  }

  onResize() {
    document.body.style.setProperty('--doc-height', `${window.innerHeight}px`);
  }

  async updateWithStandardTheme(theme: any) {
    const std = await this.ds.requestJson(`assets/themes/standard/colors.json`);
    for (const key of Object.keys(std)) {
      if (theme[key] == null) {
        theme[key] = std[key];
      }
    }
  }

  async setTheme(name: string) {
    const suffix = this.isWatch ? '-watch' : '';
    document.getElementById('themestyle').setAttribute('href', `assets/themes/${name}/index.css`);
    document.getElementById('favicon').setAttribute('href', `assets/themes/${name}/favicon${suffix}.png`);
    let theme: any;
    if (name === 'own') {
      this.restoreTheme();
      await this.updateWithStandardTheme(this.currTheme);
      GLOBALS.theme = this.currTheme;
      this.ds.saveWebData();
      return;
    } else {
      theme = await this.ds.requestJson(`assets/themes/${name}/colors.json`) ?? {};
      if (name !== 'standard') {
        await this.updateWithStandardTheme(theme);
      }
    }
    if (theme == null) {
      return;
    }
    // Log.todo('In ThemeService.setTheme könnten die Farben animiert werden, wenn ich rausfinde, wie das durch Veränderung der CSS-Variablen funktioniert.');
    // Versuch einer Farbanimation über Veränderung der Variablen - bisher leider erfolglos
    // if (this.currTheme != null) {
    //   const bodyTag = document.querySelector('body') as HTMLBodyElement;
    //   for (const key of Object.keys(theme)) {
    //     bodyTag.style.removeProperty(`--${key}`);
    //   }
    //   bodyTag.animate([
    //     this.getThemeStyle(this.currTheme),
    //     this.getThemeStyle(theme)
    //   ], {duration: 1000, direction: 'normal', fill: 'forwards'});
    //   console.log(this.getThemeStyle(this.currTheme));
    //   console.log(this.getThemeStyle(theme));
    //   // this.getThemeStyle(theme);
    // } else {
    this.assignStyle(document.body.style, theme);
//    }
    GLOBALS.theme = theme;
    this.ds.saveWebData();
  }

  assignStyle(style: CSSStyleDeclaration, theme: any): void {
    if (style == null) {
      return;
    }
    for (const key of Object.keys(theme)) {
      let value = theme[key];
      if (this.ms.colors[value] != null) {
        value = this.ms.colors[value];
      }
      this.currTheme[key] = value;
      style.setProperty(`--${key}`, value);
    }
    style.setProperty('--lang-height', this.langHeight);
    style.setProperty('--theme-width', this.themeWidth);
  }

  getThemeStyle(theme: any): any {
    const ret: any = {};
    for (const key of Object.keys(theme)) {
      let value = theme[key];
      if (this.ms.colors[value] != null) {
        value = this.ms.colors[value];
      }
      ret[`--${key}`] = value;
    }
    return ret;
  }

  // sets one value in the theme, but only if this value exists
  setThemeValue(key: string, value: string): void {
    if (document.body.style.getPropertyValue(key) != null) {
      document.body.style.setProperty(key, value);
    }
  }

  // extracts the theme from the body tag
  extractTheme(): any {
    const ret: { [key: string]: string } = {};
    const list = document.body.style.cssText.split(';');
    for (const entry of list) {
      if (!Utils.isEmpty(entry)) {
        const parts = entry.split(':');
        ret[parts[0].trim()] = parts[1].trim();
      }
    }
    return ret;
  }
}
