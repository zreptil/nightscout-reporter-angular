import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {ThemeService} from '@/_services/theme.service';
import {SessionService} from '@/_services/session.service';

@Component({
  selector: 'app-owl-menu',
  templateUrl: './owl-menu.component.html',
  styleUrls: ['./owl-menu.component.scss']
})
export class OwlMenuComponent implements OnInit {

  themeStyle = 'width:0em;';
  logoStyle = '';
  themePanelShown = false;

  constructor(public ts: ThemeService,
              public ss: SessionService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  ngOnInit(): void {
  }

  toggleThemePanel(themeKey: string): void {
    let ts = '';
    let ls = '';
    let duration = 1;
    if (this.themePanelShown) {
      this.themeStyle = `animation:hidethemes ${duration}s ease-in-out normal forwards;`;
      this.logoStyle = `animation:hidethemeslogo ${duration}s ease-in-out normal forwards;`;
      ts = 'animation-iteration-count:0;width:0em;';
      ls = 'animation-iteration-count:0;transform: rotate(0deg);';
    } else {
      this.themeStyle = `animation:showthemes ${duration}s ease-in-out normal forwards;`;
      this.logoStyle = `animation:showthemeslogo ${duration}s ease-in-out normal forwards;`;
      ts = 'animation-iteration-count:0;width:15em;';
      ls = 'animation-iteration-count:0;transform: rotate(360deg);';
    }
    setTimeout(() => {
      this.themeStyle = ts;
      this.logoStyle = ls;
      if (themeKey != '') {
        GLOBALS.theme = themeKey === 'null' ? null : themeKey;
        this.ts.setTheme(GLOBALS.theme);
      }
    }, duration * 1100);
    this.themePanelShown = !this.themePanelShown;
  }
}
