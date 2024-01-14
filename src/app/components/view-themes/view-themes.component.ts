import {AfterViewInit, Component} from '@angular/core';
import {ThemeService} from '@/_services/theme.service';
import {DataService} from '@/_services/data.service';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {MessageService} from '@/_services/message.service';
import {GLOBALS} from '@/_model/globals-data';
import {DialogResultButton, DialogType, IDialogDef} from '@/_model/dialog-data';
import {Utils} from '@/classes/utils';

@Component({
  selector: 'app-view-themes',
  templateUrl: './view-themes.component.html',
  styleUrls: ['./view-themes.component.scss']
})
export class ViewThemesComponent implements AfterViewInit {

  serverThemes: any[] = [];
  svgCollection: SafeHtml;
  apiurl = 'https://nightrep.reptilefarm.ddns.net';
  errors: any = {
    errExists: $localize`Das Thema @_themeName_@ existiert bereits. Soll es überschrieben werden?`,
    errAuthFail: $localize`Die Autorisierung ist fehlgeschlagen.`
  };
  allowed: any = {};

  constructor(public ts: ThemeService,
              public ds: DataService,
              public ms: MessageService,
              public sanitizer: DomSanitizer) {
  }

  loadThemeList(): void {
    if (this.svgCollection == null) {
      this.svgCollection = {};
      this.ds.request('assets/img/owl.svg', {options: {responseType: 'text'}}).then(result => {
        this.svgCollection = this.sanitizer.bypassSecurityTrustHtml(result.body);
      });
    }
    this.ds.request(this.apiurl,
      {
        method: 'post',
        body: `{"cmd":"list","auth":"${GLOBALS.apiAuth}"}`,
        urlOnError: `${this.apiurl}?activate`
      }).then(result => {
      this.serverThemes = [];
      if (this.ts.changed) {
        this.serverThemes.push({name: $localize`Speichern`, colors: this.ts.currTheme, isSave: true});
      }
      this.allowed = {};
      for (const key of result?.cfg) {
        this.allowed[key] = true;
      }
      if (Array.isArray(result?.themes)) {
        for (let i = 0; i < result.themes.length; i++) {
          this.serverThemes.push(result.themes[i]);
        }
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadThemeList();
    });
  }

  classForCard(theme: any): string[] {
    const ret: string[] = [];
    if (GLOBALS.theme === theme?.name) {
      ret.push('mat-elevation-z10');
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
    const keys = ['owlBody', 'owlBrow', 'owlBodyLeft', 'owlBodyRight', 'owlEyearea',
      'owlEyes', 'owlXmasBodyLeft', 'owlXmasBodyRight', 'owlXmasEyearea', 'owlXmasEyes',
      'owlXmasFrame', 'owlXmasFur', 'owlXmasFabric', 'owlWizardBodyLeft', 'owlWizardBodyRight',
      'owlWizardEyearea', 'owlWizardEyes', 'owlWizardFabric', 'owlWizardStar1', 'owlWizardStar2',
      'owlReporterFrame', 'owlReporterFabric', 'owlOwnEyearea', 'owlOwnFrame', 'owlOwnBeard',
      'owlOwnFabric', 'owlOwnEyes', 'owlOwnBodyLeft', 'owlOwnBodyRight'];
    const ret: any = {
      '--back': `${theme.colors.mainBodyBack}`,
      '--fore': `${theme.colors.mainBodyFore}`
    };
    for (const key of keys) {
      ret[`--${key}`] = theme.colors[key];
    }
    return ret;
  }

  saveTheme(theme: any, overwrite = false): void {
    const colors = Utils.encodeBase64(JSON.stringify(theme.colors));
    this.ds.request(this.apiurl,
      {
        method: 'post', body: `{"cmd":"save","name":"${theme.name}","colors":"${colors}","overwrite":${overwrite},"auth":"${GLOBALS.apiAuth}"}`,
        urlOnError: `${this.apiurl}?activate`
      }).then(result => {
      if (result.error != null) {
        if (result.error === 'errExists') {
          const text = this.errors.errExists.replace(/_themeName_/g, theme.name);
          this.ms.confirm(text)
            .subscribe(result => {
              if (result?.btn === DialogResultButton.yes) {
                this.saveTheme(theme, true);
              }
            });
        } else {
          this.ms.info(this.errors[result.error]);
        }
        return;
      } else {
        this.loadThemeList();
      }
    });
  }

  clickTheme(theme: any): void {
    if (theme.isSave) {
      const dlg: IDialogDef = {
        type: DialogType.confirm,
        title: $localize`Speichern`,
        buttons: [{title: $localize`Ok`, result: {btn: DialogResultButton.ok}}],
        controls: [{id: 'name', type: 'input', title: $localize`Name des Farbthemas`}]
      };
      this.ms.showDialog(dlg, null).subscribe(result => {
        if (result?.btn === DialogResultButton.ok) {
          const name = result.data.controls.name.value;
          if (!Utils.isEmpty(name)) {
            theme.name = name;
            this.saveTheme(theme);
          }
        }
      });
    } else {
      if (this.ts.changed) {
        this.ms.confirm($localize`Wenn das Thema "${theme.name}" geladen wird, gehen die aktuellen Änderungen verloren. Soll das Thema trotzdem geladen werden?`)
          .subscribe(result => {
            if (result?.btn === DialogResultButton.yes) {
              this.loadTheme(theme);
            }
          });
      } else {
        this.loadTheme(theme);
      }
    }
  }

  loadTheme(theme: any): void {
    this.ds.request(this.apiurl,
      {
        method: 'post', body: `{"cmd":"load","name":"${theme.name}","auth":"${GLOBALS.apiAuth}"}`,
        urlOnError: `${this.apiurl}?activate`
      }).then(result => {
      if (result.error != null) {
        this.ms.info(this.errors[result.error]);
        return;
      }
      for (const key of Object.keys(result)) {
        this.ts.currTheme[key] = result[key];
      }
      GLOBALS.theme = 'own';
      this.ts.storeTheme();
      this.ts.restoreTheme();
    });
  }

  mayDelete(theme: any): boolean {
    const keep = ['standard', 'xmas'];
    return keep.indexOf(theme.name) < 0 && !theme.isSave && this.allowed.delete;
  }

  clickDelete(theme: any) {
    this.ms.confirm($localize`Soll das Thema "${theme.name}" gelöscht werden?`)
      .subscribe(result => {
        if (result?.btn === DialogResultButton.yes) {
          this.ds.request(this.apiurl,
            {
              method: 'post', body: `{"cmd":"delete","name":"${theme.name}","auth":"${GLOBALS.apiAuth}"}`,
              urlOnError: `${this.apiurl}?activate`
            }).then(result => {
            if (result.error != null) {
              this.ms.info(this.errors[result.error]);
              return;
            } else {
              this.loadThemeList();
            }
          });
        }
      });
  }
}
