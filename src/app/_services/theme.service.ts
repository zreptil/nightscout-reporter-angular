import {Injectable} from '@angular/core';
import {DataService} from '@/_services/data.service';
import {MaterialColorService} from '@/_services/material-color.service';
import {Utils} from '@/classes/utils';
import {GLOBALS} from '@/_model/globals-data';
import {Log} from '@/_services/log.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currTheme: any = null;

  constructor(public ds: DataService,
              public ms: MaterialColorService) {
  }

  get isWatch(): boolean {
    return window.location.href.indexOf('watch') > 0;
  }

  async setTheme(name: string) {
    const suffix = this.isWatch ? '-watch' : '';
    document.getElementById('themestyle').setAttribute('href', `assets/themes/${name}/index.css`);
    document.getElementById('favicon').setAttribute('href', `assets/themes/${name}/favicon${suffix}.png`);
    const theme = await this.ds.requestJson(`assets/themes/${name}/colors.json`);
    if (theme == null) {
      return;
    }
    Log.todo('In ThemeService.setTheme könnten die Farben animiert werden, wenn ich rausfinde, wie das durch Veränderung der CSS-Variablen funktioniert.');
    // Versuch einer Farbanimation über Veränderung der Variablen - bisher leider erfolglos
    // if (this.currTheme != null) {
    //   const bodyTag = document.querySelector('body') as HTMLBodyElement;
    //   for (const key of Object.keys(theme)) {
    //     bodyTag.style.removeProperty(`--${key}`);
    //   }
    //   bodyTag.animate([
    //     this.getThemeSytle(this.currTheme),
    //     this.getThemeSytle(theme)
    //   ], {duration: 1000, direction: 'normal', fill: 'forwards'});
    //   console.log(this.getThemeSytle(this.currTheme));
    //   console.log(this.getThemeSytle(theme));
    //   // this.getThemeSytle(theme);
    // } else {
    for (const key of Object.keys(theme)) {
      let value = theme[key];
      if (this.ms.colors[value] != null) {
        value = this.ms.colors[value];
      }
      document.body.style.setProperty(`--${key}`, value);
    }
//    }
    this.currTheme = theme;
    GLOBALS.theme = name;
    this.ds.saveWebData();
  }

  getThemeSytle(theme: any): any {
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
