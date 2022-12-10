import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {ThemeService} from '@/_services/theme.service';
import {SessionService} from '@/_services/session.service';
import {DataService} from '@/_services/data.service';
import {LangData} from '@/_model/nightscout/lang-data';

@Component({
  selector: 'app-owl-menu',
  templateUrl: './owl-menu.component.html',
  styleUrls: ['./owl-menu.component.scss']
})
export class OwlMenuComponent implements OnInit {

  themeStyle = 'width:0;';
  langStyle = 'height:0;';
  logoStyle = '';
  themePanelShown = false;

  constructor(public ts: ThemeService,
              public ds: DataService,
              public ss: SessionService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  ngOnInit(): void {
  }

  togglePanels(key: string | LangData): void {
    let ts = '';
    let langs = '';
    let ls = '';
    let duration = 1;
    if (this.themePanelShown) {
      this.themeStyle = `animation:owl_hidethemes ${duration}s ease-in-out normal forwards;`;
      this.logoStyle = `animation:owl_hidethemeslogo ${duration}s ease-in-out normal forwards;`;
      this.langStyle = `animation:owl_hidelanguages ${duration}s ease-in-out normal forwards;`;
      ts = 'animation-iteration-count:0;width:0;';
      langs = 'animation-iteration-count:0;height:0;';
      ls = 'animation-iteration-count:0;transform: rotate(0deg);';
    } else {
      this.themeStyle = `animation:owl_showthemes ${duration}s ease-in-out normal forwards;`;
      this.logoStyle = `animation:owl_showthemeslogo ${duration}s ease-in-out normal forwards;`;
      this.langStyle = `animation:owl_showlanguages ${duration}s ease-in-out normal forwards;`;
      // The settings here have to be the same as the scss-variables in owl-menu.component.scss
      ts = 'animation-iteration-count:0;width:13em;';
      langs = 'animation-iteration-count:0;height:23em;';
      ls = 'animation-iteration-count:0;transform: rotate(360deg);';
    }
    setTimeout(() => {
      this.themeStyle = ts;
      this.langStyle = langs;
      this.logoStyle = ls;
      if (key != '') {
        if (typeof key === 'string') {
          GLOBALS.theme = key === 'null' ? null : key;
          this.ts.setTheme(GLOBALS.theme);
        } else {
          this.ss.changeLanguage(key);
        }
      }
    }, duration * 1100);
    this.themePanelShown = !this.themePanelShown;
  }
}
