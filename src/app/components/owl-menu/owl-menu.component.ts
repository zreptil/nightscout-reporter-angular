import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {ThemeService} from '@/_services/theme.service';
import {SessionService} from '@/_services/session.service';
import {DataService} from '@/_services/data.service';
import {LangData} from '@/_model/nightscout/lang-data';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {CloseButtonData} from '@/controls/close-button/close-button-data';

@Component({
  selector: 'app-owl-menu',
  templateUrl: './owl-menu.component.html',
  styleUrls: ['./owl-menu.component.scss'],
  standalone: false
})
export class OwlMenuComponent implements OnInit {

  themeStyle = 'width:0;';
  langStyle = 'height:0;';
  logoStyle = '';
  themePanelShown = false;
  svgCollection: SafeHtml;
  closeData: CloseButtonData = {
    showClose: false,
    colorKey: 'owl'
  };

  constructor(public ts: ThemeService,
              public ds: DataService,
              public ss: SessionService,
              public sanitizer: DomSanitizer) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  ngOnInit(): void {
    if (this.svgCollection == null) {
      this.svgCollection = {};
      this.ds.request('assets/img/owl.svg', {options: {responseType: 'text'}}).then(result => {
        this.svgCollection = this.sanitizer.bypassSecurityTrustHtml(result.body);
      });
    }
  }

  togglePanels(key: string | LangData): void {
    let ts = '';
    let langs = '';
    let ls = '';
    let duration = 1;
    this.ts.assignStyle(document.body.style, this.ts.currTheme);
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
      // The settings here have to be the same as the scss-variables in styles.scss in the root
      ts = `animation-iteration-count:0;width:${this.ts.themeWidth};`;
      langs = `animation-iteration-count:0;height:${this.ts.langHeight};`;
      ls = 'animation-iteration-count:0;transform: rotate(360deg);';
    }
    setTimeout(() => {
      this.themeStyle = ts;
      this.langStyle = langs;
      this.logoStyle = ls;
      if (key !== '') {
        if (typeof key === 'string') {
          if (key === 'own') {
            GLOBALS.viewType = 'themes';
            this.ds.save();
          } else {
            this.ts.setTheme(key === 'null' ? null : key, true);
          }
        } else {
          this.ss.changeLanguage(key);
        }
      }
    }, duration * 1100);
    this.themePanelShown = !this.themePanelShown;
  }

  owlId(key: string): string {
    return `#owl-${key}`;
  }
}
