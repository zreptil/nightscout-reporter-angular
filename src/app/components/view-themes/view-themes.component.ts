import {AfterViewInit, Component} from '@angular/core';
import {ThemeService} from '@/_services/theme.service';
import {DataService} from '@/_services/data.service';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

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
      this.ds.request('https://nightrep.reptilefarm.ddns.net/index.php',
        {asJson: true}).then(result => {
        this.serverThemes = [];
        if (this.ts.changed) {
          this.serverThemes.push({name: $localize`Aktuell`, colors: this.ts.currTheme});
        }
        for (let i = 0; i < 50; i++) {
          this.serverThemes.push(result[0]);
        }
      });
    });
  }

  classForCard(theme: any): string[] {
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
