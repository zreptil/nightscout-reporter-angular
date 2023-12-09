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
    mainHead: $localize`Titel`,
    mainBody: $localize`Inhalt`,
    settingsHead: $localize`Titel`,
    settingsBody: $localize`Inhalt`,
    settingsError: $localize`Fehler`,
    legalHead: $localize`Titel`,
    legalBody: $localize`Inhalt`,
    legalLink: $localize`Link`,
    whatsnewHead: $localize`Titel`,
    whatsnewBody: $localize`Inhalt`,
    whatsnewLink: $localize`Link`,
    local: $localize`Lokal`,
    betaBack: $localize`Beta`,
    settingsLoopMarked: $localize`Kennzeichnung für Loop`,
    outputparamsHead: $localize`Titel`,
    outputparamsBody: $localize`Inhalt`,
    shortcutHead: $localize`Titel`,
    shortcutBody: $localize`Inhalt`,
    helpHead: $localize`Titel`,
    helpBody: $localize`Inhalt`,
    infoHead: $localize`Titel`,
    infoBody: $localize`Inhalt`,
    infoWarningColor: $localize`WarningColor`,
    infoErrorColor: $localize`ErrorColor`,
    infoInfoColor: $localize`InfoColor`,
    glucLow: $localize`Niedrig`,
    glucNormLow: $localize`Normal Niedrig`,
    glucNorm: $localize`Normal`,
    glucNormHigh: $localize`Normal Hoch`,
    glucHigh: $localize`Hoch`,
    datepickerBtnEmpty: $localize`Leerer Zeitraum`,
    datepickerHeadEmpty: $localize`HeadEmptyBack`,
    datepickerHead: $localize`Titel`,
    datepickerBodyBack: $localize`Inhalt`,
    datepickerMonthTitle: $localize`MonthTitleBack`,
    datepickerMonth: $localize`MonthBack`,
    datepickerBtnRaised: $localize`Markierter Tag`,
    datepickerBtnRaisedKey: $localize`Markierte relative Zeitspanne`,
    datepickerBtnShiftKey: $localize`BtnShiftKeyBack`,
    datepickerDowActive: $localize`Aktiver Wochentag`,
    datepickerDowInactive: $localize`Inaktiver Wochentag`,
    mainSendCountFore: $localize`Anzahl Formulare`,
    mainSendCountFrame: $localize`Rand um Anzahl Formulare`,
    userPinFore: $localize`Sternmarkierung`,
    logDebug: $localize`Debug`,
    owlBody: $localize`Körper`,
    owlBrow: $localize`Stirn`,
    owlBodyLeft: $localize`Körper links`,
    owlBodyRight: $localize`Körper rechts`,
    owlEyearea: $localize`Augenpartie`,
    owlEyes: $localize`Augen`,
    owlXmasBodyLeft: $localize`Weihnacht - Körper links`,
    owlXmasBodyRight: $localize`Weihnacht - Körper rechts`,
    owlXmasEyearea: $localize`Weihnacht - Augenpartie`,
    owlXmasEyes: $localize`Weihnacht - Augen`,
    owlXmasFrame: $localize`Weihnacht - Hut Rand`,
    owlXmasFur: $localize`Weihnacht - Hut Fell`,
    owlXmasFabric: $localize`Weihnacht - Hut Stoff`,
    owlWizardBodyLeft: $localize`Zauberer - Körper links`,
    owlWizardBodyRight: $localize`Zauberer - Körper rechts`,
    owlWizardEyearea: $localize`Zauberer - Augenpartie`,
    owlWizardEyes: $localize`Zauberer - Augen`,
    owlWizardFabric: $localize`Zauberer - Hut Stoff`,
    owlWizardStar2: $localize`Zauberer - Hut Stern 2`,
    owlWizardStar1: $localize`Zauberer - Hut Stern 1`,
    owlReporterFrame: $localize`Reporterhut - Rand`,
    owlReporterFabric: $localize`Reporterhut - Stoff`,
    owlOwnBodyLeft: $localize`Anpassung - Körper links`,
    owlOwnBodyRight: $localize`Anpassung - Körper rechts`,
    owlOwnEyearea: $localize`Anpassung - Augenpartie`,
    owlOwnEyes: $localize`Anpassung - Augen`,
    owlOwnFabric: $localize`Anpassung - Stoff`,
    owlOwnBeard: $localize`Anpassung - Bart`,
    owlOwnFrame: $localize`Anpassung - Rand`,
  };

  constructor(public ds: DataService,
              public ms: MaterialColorService) {
    window.addEventListener('resize', this.onResize);
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
