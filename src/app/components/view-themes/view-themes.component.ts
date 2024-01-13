import {AfterViewInit, Component} from '@angular/core';
import {ThemeService} from '@/_services/theme.service';
import {DataService} from '@/_services/data.service';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {MessageService} from '@/_services/message.service';

@Component({
  selector: 'app-view-themes',
  templateUrl: './view-themes.component.html',
  styleUrls: ['./view-themes.component.scss']
})
export class ViewThemesComponent implements AfterViewInit {

  serverThemes: any[] = [];
  svgCollection: SafeHtml;

  constructor(public ts: ThemeService,
              public ds: DataService,
              public ms: MessageService,
              public sanitizer: DomSanitizer) {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.svgCollection == null) {
        this.svgCollection = {};
        this.ds.request('assets/img/owl.svg', {options: {responseType: 'text'}}).then(result => {
          this.svgCollection = this.sanitizer.bypassSecurityTrustHtml(result.body);
        });
      }
      const url = 'https://nightrep.reptilefarm.ddns.net';
      this.ds.request(url,
        {asJson: true, urlOnError: `${url}?activate`}).then(result => {
        this.serverThemes = [];
        if (this.ts.changed) {
          this.serverThemes.push({name: $localize`Aktuell`, colors: this.ts.currTheme});
        }
        if (Array.isArray(result)) {
          for (let i = 0; i < result.length; i++) {
            this.serverThemes.push(result[i]);
          }
        }
      });
    });
  }

  classForCard(_theme: any): string[] {
    const ret: string[] = [];
    if (false) {
      ret.push('mat-elevation-z20');
    }
    return ret;
  }

  styleForTitle(theme: any): any {
    return {
      '--back': `${theme.colors.mainHeadBack}`,
      '--fore': `${theme.colors.mainHeadFore}`
    };
  }

  styleForContent(theme: any): any {
    return {
      '--back': `${theme.colors.mainBodyBack}`,
      '--fore': `${theme.colors.mainBodyFore}`,
      '--owlOwnEyearea': theme.colors.owlOwnEyearea,
      '--owlBrow': theme.colors.owlBrow,
      '--owlOwnFrame': theme.colors.owlOwnFrame,
      '--owlOwnBeard': theme.colors.owlOwnBeard,
      '--owlOwnFabric': theme.colors.owlOwnFabric,
      '--owlOwnEyes': theme.colors.owlOwnEyes,
      '--owlOwnBodyLeft': theme.colors.owlOwnBodyLeft,
      '--owlOwnBodyRight': theme.colors.owlOwnBodyRight
    };
  }
}
