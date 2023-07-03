import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {saveAs} from 'file-saver';
import {ProgressService} from '@/_services/progress.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {UserData} from '@/_model/nightscout/user-data';
import {Utils} from '@/classes/utils';
import {UrlData} from '@/_model/nightscout/url-data';
import {DataService} from '@/_services/data.service';
import {SessionService} from '@/_services/session.service';
import {DateAdapter} from '@angular/material/core';
import {Log} from '@/_services/log.service';
import {Settings} from '@/_model/settings';
import {NightscoutService} from '@/_services/nightscout.service';
import {MatDialogRef} from '@angular/material/dialog';
import {DialogParams, DialogResultButton, DialogType} from '@/_model/dialog-data';
import {MessageService} from '@/_services/message.service';
import {LLU_API_ENDPOINTS} from '@/_model/libre-link-up/constants/llu-api-endpoints';
import {LibreLinkUpService} from '@/_services/libre-link-up.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  confirmIdx = 0;
  currApiUrlIdx = -1;
  showPwd = -1;
  showLUPwd = -1;
  showSecret = -1;
  calcDate = GlobalsData.now;
  msgCalcDayTitle = '';
  listProfileMaxCount: string[];
  @ViewChild('fileSelect')
  fileSelect: ElementRef<HTMLInputElement>;

  constructor(private dlgRef: MatDialogRef<SettingsComponent>,
              private da: DateAdapter<any>,
              public ds: DataService,
              public ps: ProgressService,
              public ss: SessionService,
              public ns: NightscoutService,
              public ms: MessageService,
              private llu: LibreLinkUpService) {
    da.setLocale(GLOBALS.language.code);
    this.fillSelects();
    if (GLOBALS.isDebug) {
      llu.nightScoutHttpHeaders().then(_value => {
        llu.execute();
      });
    }
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get msgUrlNightscout(): string {
    return $localize`Url zur Nightscout-API`;
  }

  get msgUrlHint(): string {
    return $localize`Url zur Nightscout-API (z.B. https://xxx.ns.10be.de)`;
  }

  get msgName(): string {
    return $localize`Name`;
  }

  get msgInsulin(): string {
    return $localize`Insulin`;
  }

  get msgAccessToken(): string {
    return $localize`Zugriffsschlüssel`;
  }

  get msgLinkupUsername(): string {
    return $localize`Username für Zugriff auf LibreLinkUp`;
  }

  get msgLinkupPassword(): string {
    return $localize`Passwort für Zugriff auf LibreLinkUp`;
  }

  get msgLinkupRegion(): string {
    return $localize`Region bei Zugriff auf LibreLinkUp`;
  }

  get mayAddUser(): boolean {
    if (GLOBALS.userList?.length > 0) {
      return GLOBALS.userList?.[GLOBALS.userList.length - 1]?.apiUrl(null, '', {noApi: true}) == null;
    }
    return false;
  }

  get msgStartDate(): string {
    return $localize`Daten von`;
  }

  get msgEndDate(): string {
    return $localize`Daten bis`;
  }

  get msgCalcDayFirstTitle(): string {
    return $localize`Ermittle ersten Tag mit Daten`;
  }

  get msgCalcDayLastTitle(): string {
    return $localize`Ermittle letzten Tag mit Daten`;
  }

  get infoLibreLinkUp(): string {
    return $localize`Die Konfiguration von LibreLinkUp ermöglicht es Nightwatch, die Werte, die
    über die Libre-App von Abbott vom Sensor empfangen werden, an Nightscout zu übermitteln. Um
    das zu tun, ist es notwendig, dass Nightscout Reporter auch das API-Secret der Nightscout
    Instanz kennt, weshalb man dieses hier hinterlegen muss. Die übrigen Einstellungen in diesem Bereich
    dienen dazu, die Daten von LibreLinkUp zu empfangen.`;
  }

  get msgApiSecret(): string {
    return $localize`API-Secret für Nightscout`;
  }

  get lblProfileMax(): string {
    return $localize`Die Profiltabelle sollte normalerweise nur Daten zu den verwendeten
  Profilen beinhalten. iOS Loop verwendet diese Tabelle aber dazu, um dort eigene Einstellungen zu speichern
  und tut dies bei einigen Benutzern exzessiv. Ab einer bestimmten Datenmenge kann die Profiltabelle über
  die API dann nicht mehr korrekt abgefragt werden. Deswegen gibt es hier die Möglichkeit, die Anzahl an
  Datensätzen einzuschränken, die aus dieser Tabelle geholt werden. Das ist so lange notwendig, wie
  iOS Loop oder andere Uploader diese Tabelle falsch befüllen.<br><br>Maximale Anzahl an Profildatensätzen:`;
  }

  get msgLinkupUsernameHint(): string {
    return $localize`:@@msgLinkupUsernameHint:Diese Usernamen / Passwort Kombination ermöglicht es, Daten von LibreLinkUp zu erhalten.`;
  }

  get msgLinkupRegionHint(): string {
    return $localize`:@@msgLinkupRegionHint:Hier muss die Region für LibreLinkUp angegeben werden.`;
  }

  get regionList(): string[] {
    return Object.keys(LLU_API_ENDPOINTS);
  }

  fillSelects(): void {
    this.listProfileMaxCount = [GLOBALS.msgUnlimited];
    for (let i = 1; i < GLOBALS.profileMaxCounts.length; i++) {
      this.listProfileMaxCount.push(`${GLOBALS.profileMaxCounts[i]}`);
    }
  }

  msgAccessTokenHint(isVisible: boolean): string {
    return isVisible
      ? $localize`:@@msgAccessTokenHint:Der Zugriffsschlüssel wird nur benötigt, wenn der Zugriff in Nightscout über AUTH_DEFAULT_ROLES eingeschränkt wurde`
      : '';
  }

  msgApiSecretHint(isVisible: boolean): string {
    return isVisible
      ? $localize`:@@msgApiSecretHint:Das API-Secret muss nur erfasst werden, wenn die LibreLinkUp-Funktionaliät benutzt werden soll.`
      : '';
  }

  warnApiSecretHint(isVisible: boolean): string {
    return isVisible
      ? $localize`Dieses Passwort ermöglicht es, Daten in die Nightscout Instanz zu schreiben. Bitte auf keinen Fall an andere weitergeben!`
      : '';
  }

  msgStartDateHint(isVisible: boolean): string {
    return isVisible
      ? $localize`:@@msgStartDateHint:Das Datum des ersten Tages mit Daten` : '';
  }

  msgEndDateHint(isVisible: boolean): string {
    return isVisible
      ? $localize`:@@msgEndDateHint:Das Datum des letzten kompletten Tages mit Daten`
      : '';
  }

  cancelCalculation(): void {
    this.confirmIdx = 0;
  }

  msgCalculatingDay(date: Date): string {
    return $localize`:@@msgCalculatingDay:Überprüfe ${date} ...`;
  }

  async calculateFirstDay(urlData: UrlData) {
    this.confirmIdx = 3;
    let done = false;
    this.calcDate = GlobalsData.now;
    let diff = -256;
    this.msgCalcDayTitle = this.msgCalcDayFirstTitle;
    this.ps.max = 3;
    this.ps.value = 1;
    while (this.confirmIdx === 3 && !done) {
      const check = new Date(this.calcDate.getFullYear(), this.calcDate.getMonth(), this.calcDate.getDate(), 0, 0, 0, 0);
      const url = urlData.fullUrl('entries.json', `find[date][$lte]=${check.getTime()}&count=2`);
      const json = await this.ds.request(url, {asJson: true});
      try {
        if (diff < -1) {
          if (json.length < 1) {
            diff = Math.floor(-diff / 2);
          }
        } else if (diff > 1) {
          if (json.length > 0) {
            diff = Math.floor(-diff / 2);
          }
        } else {
          done = true;
          if (json.length > 0) {
            this.calcDate = Utils.addDateDays(this.calcDate, diff);
          }
        }
        this.ps.text = $localize`Prüfe ${Utils.fmtDate(this.calcDate)} ...`;
      } catch (ex) {
        done = true;
        Log.devError(ex, 'Fehler in SettingsComponent.calculateFirstDay startDatumsErmittlung');
      }

      if (!done) {
        this.calcDate = Utils.addDateDays(this.calcDate, diff);
      }
    }
    this.ps.next();
    diff = 256;
    urlData.startDate = this.calcDate;
    done = false;
    this.msgCalcDayTitle = this.msgCalcDayLastTitle;
    while (this.confirmIdx === 3 && !done) {
      const check = new Date(this.calcDate.getFullYear(), this.calcDate.getMonth(), this.calcDate.getDate(), 23, 59, 59, 999);
      const url = urlData.fullUrl('entries.json', `find[date][$gte]=${check.getTime()}&count=2`);
      const json = await this.ds.request(url, {asJson: true});
      try {
        if (diff > 1) {
          if (json.length < 1) {
            diff = Math.floor(-diff / 2);
          }
        } else if (diff < -1) {
          if (json.length > 0) {
            diff = Math.floor(-diff / 2);
          }
        } else {
          done = true;
          if (Utils.isOnOrAfter(this.calcDate, Utils.addDateDays(GlobalsData.now, -1))) {
            this.calcDate = GlobalsData.now;
          } else if (json.length < 1) {
            this.calcDate = Utils.addDateDays(this.calcDate, -diff);
          }
        }
        this.ps.text = $localize`Prüfe ${Utils.fmtDate(this.calcDate)} ...`;
      } catch (ex) {
        done = true;
      }

      if (!done) {
        this.calcDate = Utils.addDateDays(this.calcDate, diff);
      }
    }

    if (Utils.isOnOrAfter(this.calcDate, GlobalsData.now)) {
      urlData.endDate = null;
    } else {
      urlData.endDate = this.calcDate;
    }
    this.ps.clear();
    // urlData.startDateEditString = urlData.startDateEdit;
    // Log.info(`${Utils.fmtDate(urlData.startDate)} - ${Utils.fmtDate(urlData.endDate)} ${urlData.startDateEditString}`);
    console.log(GLOBALS.user.listApiUrl);
    this.confirmIdx = 0;
  }

  clickExport(): void {
    saveAs(new Blob([Settings.doit(GLOBALS.asSharedString)]), `nightrep-cfg.${Utils.fmtDate(new Date(), 'yyyyMMdd-hhmm')}.json`);
    // this.exportData = convert.base64Encode(convert.utf8.encode(Settings.doit(g.asSharedString)));
    //
    // Future.delayed(Duration(milliseconds: 100), () {
    //   (html.querySelector('#exportForm') as html.FormElement).submit();
    // });
  }

  clickImport() {
    this.fileSelect.nativeElement.click();
  }

  fileSelected(fileInput: any) {
    if (fileInput?.target?.files?.length > 0) {
      const reader = new FileReader();
      const file = fileInput.target.files[0];
      reader.addEventListener('load', (event: any) => {
        let content = event.target.result;
        const pos = content.indexOf(',');
        if (pos >= 0) {
          content = content.substring(pos + 1);
        }
        content = Utils.decodeBase64(content);
        this.ds.fromSharedString(Settings.tiod(content));
        this.ds._initAfterLoad();
        this.fileSelect.nativeElement.value = null;
      });
      reader.readAsDataURL(file);
    } else {
      console.error(fileInput);
      Log.error(fileInput);
    }
  }

  /*
  @Output('settingsresult')
  Stream<html.UIEvent> get trigger => _trigger.stream;
  final _trigger = StreamController<html.UIEvent>.broadcast(sync: true);

  SettingsComponent();

  String progressText;

  void confirmOk() {
    switch (confirmIdx) {
      case 1:
        try {
          g.userList.removeAt(g.userIdx);
          g.isConfigured &= g.userList.isNotEmpty;
          if (!g.isConfigured) {
            g.saveWebData();
            fire('ok');
          }
          // ignore: empty_catches
        } catch (e) {}
        break;
      case 2:
        try {
          g.user.listApiUrl.removeAt(currApiUrlIdx);
          // ignore: empty_catches
        } catch (e) {}
        break;
    }
    confirmIdx = 0;
  }

  void removeUrl(int idx) {}

  String exportData = '';

  String get msgExport => Intl.message('Bitte den Dateinamen für die Speicherung auswählen');

  void fire(String type) {
    switch (type) {
      case 'check':
        checkUser('ok');
        return;
      case 'cancel':
        break;
    }
    _trigger.add(html.UIEvent(type, detail: 0));
    errUserInvalid = null;
  }
  */
  ngOnInit(): void {
  }

  msgCheckUser(url: string): string {
    return $localize`:@@msgCheckUser:Überprüfe Zugriff auf ${url}...`;
  }

  addUser(): void {
    if (!Utils.isEmpty(GLOBALS.userList[GLOBALS.userList.length - 1].apiUrl(null, ''))) {
      const user = new UserData();
      GLOBALS.userList.push(user);
      GLOBALS.userIdx = GLOBALS.userList.length - 1;
    }
  }

  deleteUrl(idx: number): void {
    this.ms.confirm($localize`Soll die URL ${GLOBALS.user.listApiUrl[idx].url} vom Benutzer wirklich gelöscht werden?`, new DialogParams({theme: 'settings', icon: 'delete'})).subscribe(result => {
      switch (result.btn) {
        case DialogResultButton.yes:
          GLOBALS.user.listApiUrl.splice(idx, 1);
          break;
      }
    });
    this.currApiUrlIdx = idx;
    this.confirmIdx = 2;
  }

  addUrl() {
    GLOBALS.user.listApiUrl.push(new UrlData());
  }

  async checkUser() {
    GLOBALS.user.listApiUrl.sort((a, b) => Utils.compareDate(a.endDate, b.endDate));
    this.ps.text = this.msgCheckUser(GLOBALS.user.apiUrl(null, '', {noApi: true}));
    const ret = await this.ss.isUserValid(GLOBALS.user);
    this.ps.text = null;
    if (ret != null) {
      const buttons = [];
      if ((ret as any)?.buttons != null) {
        buttons.push(...(ret as any).buttons);
      }
      buttons.push({title: $localize`Nein`, result: {btn: DialogResultButton.no}, icon: 'close'});
      buttons.push({title: $localize`Ja`, result: {btn: DialogResultButton.yes}, focus: true, icon: 'done'});
      this.ms.showDialog({
        type: DialogType.confirm,
        title: $localize`Soll gespeichert werden?`,
        buttons: buttons
      }, ret.msg, false, new DialogParams({theme: 'settings'}))
        //        this.ms.confirm($localize`${ret}<br><br>Soll gespeichert werden, obwohl die URL nicht erreichbar ist?`, 'settings')
        .subscribe(result => {
          switch (result.btn) {
            case DialogResultButton.yes:
              this.ds.saveWebData();
              this.closeDialog();
              break;
          }
        });
      return;
    }
    if (ret == null) {
      GLOBALS.isConfigured = true;
      this.ds.saveWebData();
      this.closeDialog();
    }
  }

  closeDialog(): void {
    GLOBALS.sortUserList();
    this.dlgRef.close({btn: DialogResultButton.ok});
  }

  dateChange(item: any, setter: string, event: any) {
    item[setter] = event.value;
  }

  clickSave() {
    this.checkUser();
  }
}
