import {AfterViewInit, Component} from '@angular/core';
import {ThemeService} from '@/_services/theme.service';
import {DataService} from '@/_services/data.service';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {MessageService} from '@/_services/message.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {DialogResultButton, DialogType, IDialogDef} from '@/_model/dialog-data';
import {Utils} from '@/classes/utils';
import {Settings} from '@/_model/settings';
import {map, Observable, of} from 'rxjs';
import {Clipboard} from '@angular/cdk/clipboard';
import {MatChipListboxChange} from '@angular/material/chips';

class ServerTheme {
  // name of theme
  name: string;
  // public name of user who created that theme
  username: string;
  // colors of theme
  colors: any;
  // user id of create-user
  creator?: string;
  // visibility of theme (0 = admin, 1 = user, 2 = everyone)
  visible?: number;
  // allowed actions on this theme
  actions?: string[] = [];
  // true, if theme is used for saving the current theme
  isSave?: boolean = false;
  // timestamp of last modification
  modifyTime: string;
}

@Component({
  selector: 'app-view-themes',
  templateUrl: './view-themes.component.html',
  styleUrls: ['./view-themes.component.scss'],
})
export class ViewThemesComponent implements AfterViewInit {

  serverThemes: ServerTheme[] = [];
  svgCollection: SafeHtml;
  errors: any = {
    errExists: $localize`Das Thema @_themeName_@ existiert bereits. Soll es überschrieben werden?`,
    errExistsFixed: $localize`Das Thema @_themeName_@ existiert bereits und kann von Dir nicht überschrieben werden. Bitte gib einen anderen Namen ein.`,
    errAuthFail: $localize`Die Autorisierung ist fehlgeschlagen.`,
    errReservedName: $localize`Der Name @_themeName_@ darf nicht verwendet werden. Bitte gib einen anderen Namen ein.`,
    errNoThemeDB: $localize`Die Datenbank für die Farbthemen ist nicht verfügbar.`
  };
  allowed: any = {};

  constructor(public ts: ThemeService,
              public ds: DataService,
              public ms: MessageService,
              public sanitizer: DomSanitizer,
              private clipboard: Clipboard) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get cardForSave(): ServerTheme {
    if (GLOBALS.themeChanged && (this.allowed.save || this.allowed.admin)) {
      return {
        name: $localize`Speichern`,
        username: GLOBALS.publicUsername,
        colors: this.ts.currTheme,
        isSave: true,
        modifyTime: ''
      };
    }
    return null;
  }

  copyData(_evt: MouseEvent) {
    this.ts.packTheme((data) => {
      const pending = this.clipboard.beginCopy(data);
      let remainingAttempts = 3;
      const attempt = () => {
        const result = pending.copy();
        if (!result && --remainingAttempts) {
          setTimeout(attempt);
        } else {
          this.ms.info('Das aktuelle Thema wurde ins Clipboard kopiert');
          // Remember to destroy when you're done!
          pending.destroy();
        }
      };
      attempt();
    }, (error) => {
      console.error(error);
      this.ms.error(error as string);
    });
  }

  getData(): void {
    const dlg: IDialogDef = {
      type: DialogType.confirm,
      title: $localize`Farbthema importieren`,
      buttons: [{title: $localize`Ok`, result: {btn: DialogResultButton.ok}}],
      controls: [{id: 'theme', type: 'textarea', title: $localize`Kopiertes Farbthema einfügen`}]
    };
    this.ms.showDialog(dlg, null).subscribe(result => {
      if (result?.btn === DialogResultButton.ok) {
        const theme = result.data.controls.theme.value;
        if (!Utils.isEmpty(theme)) {
          this.ts.unpackTheme(theme, (data) => {
            for (const key of Object.keys(this.ts.currTheme)) {
              this.ts.currTheme[key] = data[key] ?? this.ts.currTheme[key];
            }
            GLOBALS.themeChanged = true;
            this.ts.assignStyle(document.body.style, this.ts.currTheme);
            this.ts.storeTheme();
          }, (error) => {
            console.error(error);
            this.ms.error(error as string);
          });
        }
      }
    });
  }

  loadThemeList(): void {
    if (this.svgCollection == null) {
      this.svgCollection = {};
      this.ds.request('assets/img/owl.svg', {options: {responseType: 'text'}}).then(result => {
        this.svgCollection = this.sanitizer.bypassSecurityTrustHtml(result.body);
      });
    }
    this.ds.request(GLOBALS.urlThemeServer,
      {
        method: 'post',
        body: JSON.stringify({
          cmd: 'list',
          auth: GLOBALS.apiAuth,
          tss: GLOBALS.themeServerSecret
        }),
        urlOnError: `${GLOBALS.urlThemeServer}?activate`
      }).then(result => {
      this.serverThemes = [];
      this.allowed = {};
      if (result?.error != null) {
        this.showError(result?.error).subscribe(action => {
          switch (action) {
            case 'authReset':
              this.loadThemeList();
              break;
            case 'authFail':
              GLOBALS.viewType = 'tile';
              break;
          }
        });
        return;
      }
      if (typeof result == 'string') {
        GLOBALS.viewType = 'tile';
        this.ms.info(result);
        return;
      }
      for (const key of result?.cfg) {
        this.allowed[key] = true;
      }
      if (Array.isArray(result?.themes)) {
        for (let i = 0; i < result.themes.length; i++) {
          const t = result.themes[i];
          const m = `${t.m}`;
          const d = new Date(
            +m.substring(0, 4),
            +m.substring(4, 6) - 1,
            +m.substring(6, 8),
            +m.substring(8, 10),
            +m.substring(10, 12),
            +m.substring(12, 14)
          );
          const time = Utils.fmtDateTime(d);
          this.serverThemes.push({
            name: t.n,
            username: t.u,
            creator: t.x,
            colors: t.c,
            actions: t.a,
            modifyTime: time
          });
        }
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadThemeList();
    });
  }

  classForCard(theme: ServerTheme): string[] {
    const ret: string[] = [];
    if (Settings.msgThemeOwn === theme?.name) {
      ret.push('mat-elevation-z10');
    }
    return ret;
  }

  styleForTitle(theme: ServerTheme): any {
    return {
      '--back': `${theme.colors.mainHeadBack}`,
      '--fore': `${theme.colors.mainHeadFore}`
    };
  }

  styleForContent(theme: ServerTheme): any {
    const keys = ['owlBody', 'owlBrow', 'owlBodyLeft', 'owlBodyRight', 'owlEyearea',
      'owlEyes', 'owlXmasBodyLeft', 'owlXmasBodyRight', 'owlXmasEyearea', 'owlXmasEyes',
      'owlXmasFrame', 'owlXmasFur', 'owlXmasFabric', 'owlWizardBodyLeft', 'owlWizardBodyRight',
      'owlWizardEyearea', 'owlWizardEyes', 'owlWizardFabric', 'owlWizardStar1', 'owlWizardStar2',
      'owlReporterFrame', 'owlReporterFabric', 'owlOwnEyearea', 'owlOwnFrame', 'owlOwnBeard',
      'owlOwnFabric', 'owlOwnEyes', 'owlOwnBodyLeft', 'owlOwnBodyRight', 'owlOwnBrow'];
    const ret: any = {
      '--back': `${theme.colors.mainBodyBack}`,
      '--fore': `${theme.colors.mainBodyFore}`
    };
    for (const key of keys) {
      ret[`--${key}`] = theme.colors[key];
    }
    return ret;
  }

  saveTheme(theme: ServerTheme, overwrite = false): void {
    const colors = Utils.encodeBase64(JSON.stringify(this.ts.currTheme));
    this.ds.request(GLOBALS.urlThemeServer,
      {
        method: 'post', body: JSON.stringify({
          cmd: 'save',
          name: theme.name,
          username: theme.username,
          visible: theme.visible,
          colors: colors,
          overwrite: overwrite,
          auth: GLOBALS.apiAuth,
          tss: GLOBALS.themeServerSecret
        }),
        urlOnError: `${GLOBALS.urlThemeServer}?activate`
      }).then(result => {
      if (result.error != null) {
        if (result.error === 'errExists') {
          const text = this.errors[result.error].replace(/_themeName_/g, theme.name);
          this.ms.confirm(text)
            .subscribe(result => {
              if (result?.btn === DialogResultButton.yes) {
                this.saveTheme(theme, true);
              }
            });
        } else if (result.error === 'errReservedName' || result.error === 'errExistsFixed') {
          const text = this.errors[result.error].replace(/_themeName_/g, theme.name);
          this.ms.error(text);
        } else {
          this.showError(result.error);
        }
        return;
      } else {
        GLOBALS.apiAuth = result.auth;
        GLOBALS.themeChanged = false;
        this.ds.save();
        this.loadThemeList();
      }
    });
  }

  clickTheme(theme: ServerTheme): void {
    if (theme.isSave) {
      console.log('gucki', GLOBALS.publicUsername);
      const dlg: IDialogDef = {
        type: DialogType.confirm,
        title: $localize`Speichern`,
        buttons: [{title: $localize`Ok`, result: {btn: DialogResultButton.ok}}],
        controls: [
          {
            id: 'name',
            type: 'input',
            title: $localize`Name des Farbthemas`,
            value: GLOBALS.theme
          },
          {
            id: 'username',
            type: 'input',
            title: $localize`Name des Benutzers`,
            hint: $localize`Wird als Autor des Farbthemas angezeigt`,
            value: GLOBALS.publicUsername
          },
          {
            id: 'public',
            type: 'checkbox',
            title: $localize`Für andere Benutzer verfügbar`,
            value: true
          }
        ]
      };
      this.ms.showDialog(dlg, null).subscribe(result => {
        if (result?.btn === DialogResultButton.ok) {
          const name = result.data.controls.name.value;
          GLOBALS.publicUsername = result.data.controls.username.value;
          if (!Utils.isEmpty(name)) {
            const t = new ServerTheme();
            t.name = name;
            t.username = GLOBALS.publicUsername;
            t.visible = result.data.controls.public ? 2 : 1;
            this.ds.save();
            this.saveTheme(t);
          }
        }
      });
    } else {
      if (GLOBALS.themeChanged) {
        this.ms.confirm($localize`Wenn das Thema @${theme.name}@ geladen wird, gehen die aktuellen Änderungen verloren. Soll das Thema trotzdem geladen werden?`)
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

  loadTheme(theme: ServerTheme): void {
    this.ds.request(GLOBALS.urlThemeServer,
      {
        method: 'post', body: JSON.stringify({
          cmd: 'load',
          name: theme.name,
          auth: GLOBALS.apiAuth,
          tss: GLOBALS.themeServerSecret
        }),
        urlOnError: `${GLOBALS.urlThemeServer}?activate`
      }).then(result => {
      if (result.error != null) {
        this.showError(result.error);
        return;
      }
      for (const key of Object.keys(result)) {
        this.ts.currTheme[key] = result[key];
      }
      GLOBALS.theme = theme.name;
      GLOBALS.themeChanged = false;
      this.ts.storeTheme();
      this.ts.restoreTheme();
    });
  }

  mayDelete(theme: ServerTheme): boolean {
    return !theme.isSave
      && this.may(theme, 'delete')
      && theme.actions.indexOf('delete') >= 0;
  }

  may(theme: ServerTheme, key: string): boolean {
    return this.allowed[key] || this.allowed.admin;
  }

  clickDelete(theme: ServerTheme) {
    this.ms.confirm($localize`Soll das Thema @${theme.name}@ gelöscht werden?`)
      .subscribe(result => {
        if (result?.btn === DialogResultButton.yes) {
          this.ds.request(GLOBALS.urlThemeServer,
            {
              method: 'post', body: JSON.stringify({
                cmd: 'delete',
                name: theme.name,
                auth: GLOBALS.apiAuth,
                tss: GLOBALS.themeServerSecret,
                urlOnError: `${GLOBALS.urlThemeServer}?activate`
              })
            }).then(result => {
            if (result.error != null) {
              this.showError(result.error);
              return;
            } else {
              this.loadThemeList();
            }
          });
        }
      });
  }

  showError(error: string): Observable<string> {
    if (error === 'errAuthFail') {
      return this.ms.confirm([
        $localize`Für die Farbthemen wird eine Autorisierung benötigt, die aktuell nicht korrekt gesetzt ist.`,
        $localize`Soll die Autorisierung zurückgesetzt werden?`])
        .pipe(map(result => {
          if (result?.btn === DialogResultButton.yes) {
            GLOBALS.apiAuth = null;
            this.ds.saveWebData();
            return 'authReset';
          }
          return 'authFail';
        }));
    } else if (error === 'errNoThemeDB') {
      this.ms.error(this.errors[error]);
      GLOBALS.viewType = 'tile';
      this.ds.saveWebData();
      return of('failed');
    } else {
      this.ms.error(this.errors[error] ?? error);
      return of('ok');
    }
  }

  openDB() {
    let url = GLOBALS.urlThemeServer.replace(/index.php/g, '');
    if (!url.endsWith('/')) {
      url += '/';
    }
    window.open(`${url}phpliteadmin.php`);
  }

  clickThemeServer(evt: MatChipListboxChange) {
    if (evt.value != null) {
      GLOBALS.urlThemeServerIdx = evt.value;
      this.ngAfterViewInit();
    }
  }

  getDisplayUrl(url: string) {
    url = url.replace(/https:\/\/([^\/]*)\/(.*)/g, '$1');
    return url;
  }
}
