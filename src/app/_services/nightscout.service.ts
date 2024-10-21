import {Injectable} from '@angular/core';
import {ReportData} from '@/_model/report-data';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {Utils} from '@/classes/utils';
import {ProgressService} from '@/_services/progress.service';
import {UserData} from '@/_model/nightscout/user-data';
import {UrlData} from '@/_model/nightscout/url-data';
import {DataNeeded} from '@/forms/base-print';
import {FormConfig} from '@/forms/form-config';
import {DataService, RequestParams} from '@/_services/data.service';
import {StatusData} from '@/_model/nightscout/status-data';
import {ProfileData} from '@/_model/nightscout/profile-data';
import {Log} from '@/_services/log.service';
import {JsonData} from '@/_model/json-data';
import {ProfileStoreData} from '@/_model/nightscout/profile-store-data';
import {EntryData} from '@/_model/nightscout/entry-data';
import {TreatmentData} from '@/_model/nightscout/treatment-data';
import {DeviceStatusData} from '@/_model/nightscout/device-status-data';
import {ActivityData} from '@/_model/nightscout/activity-data';
import {ThemeService} from '@/_services/theme.service';
import {DialogParams, DialogResultButton, DialogType, IDialogDef} from '@/_model/dialog-data';
import {MessageService} from '@/_services/message.service';
import {firstValueFrom} from 'rxjs';
import {ProfileParams} from '@/_model/nightscout/profile-gluc-data';
import {DayData} from '@/_model/nightscout/day-data';
import {ListData} from '@/_model/nightscout/list-data';
import {StatisticData} from '@/_model/nightscout/statistic-data';
import {Settings} from '@/_model/settings';
import {SettingsComponent} from '@/components/settings/settings.component';

@Injectable({
  providedIn: 'root'
})
export class NightscoutService {

  public reportData: ReportData;

  constructor(public ps: ProgressService,
              public ds: DataService,
              public ts: ThemeService,
              public ms: MessageService) {
  }

  get msgProfileError(): string {
    return $localize`Beim Auslesen der Profile ist ein Fehler aufgetreten. Möglicherweise sind zu viele Daten in der Profiltabelle (wird z.B. von iOS Loop verursacht).
Du kannst versuchen, in den Einstellungen die Anzahl an auszulesenden Profildatensätzen zu verringern.`;
  }

  get msgPreparingPDF(): string {
    return $localize`Lade die Basisdaten...`;
  }

  get msgEmptyRange(): string {
    return $localize`Bitte einen Zeitraum wählen.`;
  }

  get msgModelName(): string {
    return $localize`:modelname used in images on tiles:Max Mustermann`;
  }

  get msgPreparingData(): string {
    return $localize`:text when data was received and is being prepared to be used in the report:Bereite Daten vor...`;
  }

  msgTooMuchProfilesPrefix(maxCount: number): string {
    return $localize`Es konnten nicht alle Profile geladen werden, da im ausgewählten Zeitraum mehr als ${maxCount} gespeichert sind. `;
  }

  msgTooMuchProfiles(maxCount: number, count: number, text: string): string {
    return this.msgTooMuchProfilesPrefix(maxCount) +
      Utils.plural(count, {
        0: '',
        1: $localize`Der Uploader "${text}" hat die Datensätze angelegt.`,
        other: Utils.isEmpty(text)
          ? $localize`Die Uploader konnten nicht ermittelt werden`
          : $localize`Folgende Uploader haben die Datensätze angelegt: ${text}`
      },);
  }

  msgLoadingDataFor(date: string): string {
    return $localize`:displayed when data of a day is loading:Lade Daten für ${date}...`;
  }

  checkCfg(cfg: FormConfig): boolean {
    return cfg.checked
      && (!cfg.form.isDebugOnly || GLOBALS.isDebug)
      && (!cfg.form.isLocalOnly || GLOBALS.isLocal);
  }

  clickSettings() {
    console.log('Da haben wirs');
  }

  async loadData(isForThumbs: boolean) {
    Log.clear();
    Log.startTimer('load data started');
    GLOBALS.pdfWarnings.init();
    this.ps.init({
      progressPanelBack: this.ts.currTheme.outputparamsHeadBack,
      progressPanelFore: this.ts.currTheme.outputparamsHeadFore,
      progressBarColor: this.ts.currTheme.outputparamsBodyBack
    });
    let beg: Date;
    let end: Date;
    if (isForThumbs) {
      beg = new Date(2019, 8, 26);
      end = new Date(2019, 9, 1);
      // beg = new Date(2022, 9, 26);
      // end = new Date(2022, 9, 26);
      this.reportData = null;
    } else {
      beg = GLOBALS.period.shiftStartBy(GLOBALS.currPeriodShift.months);
      end = GLOBALS.period.shiftEndBy(GLOBALS.currPeriodShift.months);
    }

    if (this.reportData != null
      && Utils.isSameDay(this.reportData.begDate, beg)
      && Utils.isSameDay(this.reportData.endDate, end)
      && this.reportData.isValid
      && !this.reportData.mustReload) {
      this.ps.info = '';
      this.ps.text = this.msgPreparingPDF;
      this.ps.max = 1;
      this.ps.value = 0;
      this.calcStatistics(this.reportData, this.reportData.calc);
      this.calcStatistics(this.reportData, this.reportData.ns);
      this.reportData.isValid = true;
      return this.reportData;
    }
    const data = new ReportData(beg, end);
    data.isForThumbs = isForThumbs;

    if (isForThumbs) {
      data.user = new UserData();
      data.user.name = this.msgModelName;
      data.user.birthDate = '13.2.1965';
      data.user.diaStartDate = '1.1.1996';
      data.user.insulin = 'Novorapid';
      data.user.listApiUrl = [];
      data.user.listApiUrl.push(UrlData.fromJson({
        u: 'https://diamant.ns.10be.de',
        // 't': 'usertoken',
        sd: null,
        ed: null
      }));
      data.user.customData = {};
      data.user.formParams = {};
    } else {
      data.user = GlobalsData.user;
    }
    this.reportData = data;
    const needed = new DataNeeded(false, false, false, false);

    const funcList: ((user: UserData) => Promise<void>)[] = [];

    for (const cfg of GLOBALS.listConfigOrg) {
      if (this.checkCfg(cfg)) {
        needed.mix(cfg.form.needed);
        funcList.push(cfg.form.loadUserData);
      }
    }

    if (needed.needsStatus) {
      this.ps.max = GLOBALS.userList.length + 1;
      this.ps.value = 0;
      for (const user of GLOBALS.userList) {
        if (needed.status.anybody || user.userIdx === GlobalsData.user.userIdx) {
          this.ps.text = this.msgLoadingDataFor(user.name);
          try {
            const reqParams: RequestParams = {showError: false};
            const url = user.apiUrl(null, 'status.json', {reqParams: reqParams});
            Log.displayLink('status', url, {type: 'debug'});
            const content = await this.ds.requestJson(url, reqParams);
            user.status = null;
            if (content != null) {
              user.status = StatusData.fromJson(content);
              for (const func of funcList) {
                await func(user);
              }
            }
          } catch (ex) {
            user.status = null;
          }
          user.isReachable = user.status != null;
        }
        // if (sendIcon != 'stop') return data;
      }
      // GLOBALS.save(skipReload: true);
    } else {
      GLOBALS.user.status = null;
      try {
        const reqParams: RequestParams = {showError: false};
        const url = GLOBALS.user.apiUrl(null, 'status.json', {reqParams: reqParams});
        const content = await this.ds.requestJson(url, reqParams);
        if (content != null) {
          GLOBALS.user.status = StatusData.fromJson(content);
        }
      } catch (ex) {
        console.error(ex);
        GLOBALS.user.status = null;
      }
      GLOBALS.user.isReachable = GLOBALS.user.status != null;
      if (!needed.needsData || !GLOBALS.user.isReachable) {
        setTimeout(() => this.showTimeoutMessage(
          Utils.join([
            '@settings@'
            , $localize`Der Nightscout Server ist nicht erreichbar. Bitte prüfe in den Einstellungen, ob der Zugriff korrekt konfiguriert wurde.`
          ], '')
        ));
        this.ps.cancel();
        return data;
      }
    }

    // const bd = new Date(data.begDate.getFullYear(), data.begDate.getMonth(), data.begDate.getDate());
    // const ed = new Date(data.endDate.getFullYear(), data.endDate.getMonth(), data.endDate.getDate());

    let begDate = data.begDate;
    let endDate = data.endDate;

    // g.msg.links = [];
    // g.msg.type = 'msg toggle-debug';

    const reqParams: RequestParams = {};
    let url = data.user.apiUrl(endDate, 'status.json', {reqParams: reqParams});
    Log.displayLink($localize`status`, url, {type: 'debug'});
    let content = await this.ds.requestJson(url, reqParams);
    if (content != null) {
      data.status = StatusData.fromJson(content);
      if (data.status.status === '401') {
        data.user.isReachable = false;
        return data;
      }
    }

    let baseProfile: ProfileData;

    const list = GLOBALS.findUrlDataFor(begDate, endDate);
    data.user.profileMaxIdx ??= 0;
    let maxCount = GLOBALS.profileMaxCounts[data.user.profileMaxIdx];
//*
    for (const urlData of list) {
      // Mit dieser Abfrage kann man Daten filtern (nirgends dokumentiert, funktioniert auch nicht immer)
      // https://xxx/api/v1/profiles.json?find[startDate][$gt]=2018-01-01T11:30:17.694Z
      //const date = new Date(begDate.getFullYear(), begDate.getMonth() - 1, 1);
      //const month = `${date.getMonth() + 1}`.padStart(2, '0');
      //const urlParams = `find[startDate][$gte]=${date.getFullYear()}-${month}-01T00:00:00.000Z&count=${maxCount}`;
      // url = urlData.fullUrl('profile.json', urlParams);
      let reqParams: RequestParams = {onDone: urlData.requestDone, timeout: 10000};
      url = urlData.fullUrl('profile.json', `count=${maxCount}`);
      content = await this.ds.requestJson(url, reqParams);
      while (content == null && data.user.profileMaxIdx < GLOBALS.profileMaxCounts.length - 1) {
        data.user.profileMaxIdx++;
        maxCount = GLOBALS.profileMaxCounts[data.user.profileMaxIdx];
        url = urlData.fullUrl('profile.json', `count=${maxCount}`);
        content = await this.ds.requestJson(url, reqParams);
      }
      Log.displayLink(`profiles (${content?.length})`, url, {count: content?.length, type: 'debug'});

      try {
        GLOBALS.basalPrecisionAuto = 0;
        let src: any[] = content;
        const uploaders: string[] = [];

        if (src == null) {
          src = [];
          console.error('Vermutlich sind zu viele Einträge in der Profiltabelle. Bitte bei Einstellungen die Maximale Anzahl an Datensätzen reduzieren.');
        } else {
          for (const entry of src) {
            // don't add profiles that cannot be read
            try {
              const profile = ProfileData.fromJson(entry, true);
              data.profiles.push(profile);
              if (profile.enteredBy != null && uploaders.indexOf(profile.enteredBy) < 0) {
                uploaders.push(profile.enteredBy);
              }
            } catch (ex) {
            }
            GLOBALS.basalPrecisionAuto = Math.max(GLOBALS.basalPrecision, Utils.last(data.profiles).maxPrecision);
          }
          data.profiles.sort((a, b) => Utils.compareDate(a.startDate, b.startDate));
        }

        const check = Utils.addDateDays(new Date(begDate.getFullYear(), begDate.getMonth(), begDate.getDate(), 23, 59, 59, 999), -1);
        if (src.length === maxCount && Utils.isAfter(Utils.last(data.profiles).startDate, check)) {
          Log.warn(this.msgTooMuchProfiles(maxCount, uploaders.length, uploaders.join(', ')));
        }

        baseProfile = data.profiles[0];
        //        display("${ret.begDate.toString()} - ${ret.endDate.toString()}");
      } catch (ex) {
        Log.devError(ex, this.msgProfileError);
      }
      let params = `find[created_at][$gte]=${begDate.getFullYear() - 1}-01-01T00:00:00.000Z&find[eventType]=Profile Switch`;
      if (GLOBALS.ppFixAAPS30) {
        params +=
          `&find[profilePlugin][$ne]=info.nightscout.androidaps.plugins.profile.local.LocalProfilePlugin&count=10000`;
      }

      // find profileswitches in treatments, create profiledata and mix it in the profiles
      reqParams = {onDone: urlData.requestDone, timeout: urlData.timeout};
      url = urlData.fullUrl('treatments.json', params);
      content = await this.ds.requestJson(url, reqParams);
      Log.displayLink(`profileswitch (${content?.length})`, url, {count: content?.length, type: 'debug'});
      if (content != null) {
        try {
          // const src = content;
          // if (g.isLocal)src.add({
          //   "_id": "fake",
          //   "eventType": "Profile Switch",
          //   "duration": 86400,
          //   "profile": "Fake",
          //   "profileJson": '{"dia": "5","carbratio": [{"time": "00:00", "value": "0.1", "timeAsSeconds": "0"},'
          //   '{"time": "01:30", "value": "0.2", "timeAsSeconds": "5400"},'
          //   '{"time": "06:00", "value": "0.3", "timeAsSeconds": "21600"},'
          //   '{"time": "11:00", "value": "0.4", "timeAsSeconds": "39600"},'
          //   '{"time": "15:30", "value": "0.5", "timeAsSeconds": "55800"},'
          //   '{"time": "19:00", "value": "0.6", "timeAsSeconds": "68400"},'
          //   '{"time": "21:00", "value": "0.7", "timeAsSeconds": "75600"}],'
          //   '"carbs_hr": "0","delay": "20","sens": [{"time": "00:00", "value": "60", "timeAsSeconds": "0"},'
          //   '{"time": "01:30", "value": "40", "timeAsSeconds": "5400"},'
          //   '{"time": "06:00", "value": "30", "timeAsSeconds": "21600"},'
          //   '{"time": "11:00", "value": "40", "timeAsSeconds": "39600"},'
          //   '{"time": "15:30", "value": "50", "timeAsSeconds": "55800"},'
          //   '{"time": "19:00", "value": "60", "timeAsSeconds": "68400"},'
          //   '{"time": "21:00", "value": "90", "timeAsSeconds": "75600"}],'
          //   '"timezone": "Europe\\/Berlin","basal": [{"time": "00:00", "value": "0.1", "timeAsSeconds": "0"},'
          //   '{"time": "01:00", "value": "0.2", "timeAsSeconds": "3600"},'
          //   '{"time": "02:00", "value": "0.3", "timeAsSeconds": "7200"},'
          //   '{"time": "03:00", "value": "0.4", "timeAsSeconds": "10800"},'
          //   '{"time": "04:00", "value": "0.5", "timeAsSeconds": "14410"},'
          //   '{"time": "05:00", "value": "0.6", "timeAsSeconds": "18000"},'
          //   '{"time": "06:00", "value": "0.7", "timeAsSeconds": "21600"},'
          //   '{"time": "07:00", "value": "0.8", "timeAsSeconds": "25200"},'
          //   '{"time": "08:00", "value": "0.9", "timeAsSeconds": "28800"},'
          //   '{"time": "09:00", "value": "1.0", "timeAsSeconds": "32400"},'
          //   '{"time": "10:00", "value": "1.1", "timeAsSeconds": "36000"},'
          //   '{"time": "11:00", "value": "1.2", "timeAsSeconds": "39600"},'
          //   '{"time": "12:00", "value": "1.3", "timeAsSeconds": "43200"},'
          //   '{"time": "13:00", "value": "1.4", "timeAsSeconds": "46800"},'
          //   '{"time": "14:00", "value": "1.5", "timeAsSeconds": "50400"},'
          //   '{"time": "15:00", "value": "1.6", "timeAsSeconds": "54000"},'
          //   '{"time": "16:00", "value": "1.7", "timeAsSeconds": "57600"},'
          //   '{"time": "17:00", "value": "1.8", "timeAsSeconds": "61200"},'
          //   '{"time": "18:00", "value": "1.9", "timeAsSeconds": "64800"},'
          //   '{"time": "19:00", "value": "2.0", "timeAsSeconds": "68400"},'
          //   '{"time": "20:00", "value": "2.1", "timeAsSeconds": "72000"},'
          //   '{"time": "21:00", "value": "2.2", "timeAsSeconds": "75600"},'
          //   '{"time": "22:00", "value": "2.3", "timeAsSeconds": "79200"},'
          //   '{"time": "23:00", "value": "2.4", "timeAsSeconds": "82800"}],'
          //   '"target_low": [{"time": "00:00", "value": "100", "timeAsSeconds": "0"},'
          //   '{"time": "06:00", "value": "110"},{"time": "20:00", "value": "100"}],'
          //   '"target_high": [{"time": "00:00", "value": "100", "timeAsSeconds": "0"},'
          //   '{"time": "06:00", "value": "110"},{"time": "20:00", "value": "100"}],'
          //   '"startDate": "1970-01-01T00:00:00.000Z","units": "mg/dl"}',
          //   "profilePlugin": "info.nightscout.androidaps.plugins.ProfileNS.NSProfilePlugin",
          //   "created_at": "2019-03-04T10:00:00Z",
          //   "enteredBy": "Nightscout Reporter",
          //   "NSCLIENT_ID": 12345,
          //   "carbs": null,
          //   "insulin": null
          // });
          // for (const entry of src) {
          for (const entry of content) {
            const check = JsonData.toDate(entry.created_at);
            if (data.profiles.find((p) => p.createdAt.getTime() === check.getTime()) != null || entry.profile == null) {
              continue;
            }
            const parts: string[] = [];
            let store: ProfileStoreData;
            parts.push(`{"_id":"${entry._id}","defaultProfile":"${entry.profile}"`);
            // some uploaders (e.g. Minimed 600-series) don't save profileJson, so we need
            // to find it here
            if (entry.profileJson == null) {
              let key = entry.profile;
              const prof = Utils.findLast(data.profiles,
                ((p) => Utils.isBefore(p.startDate, check) && p.store[key] != null));
              if (prof != null) {
                store = prof.store[key];
              }
            } else {
              // since carbs_hr may not be in the profileJson, this must be extracted
              // from the original profile if this can be found
              if (entry.profileJson.indexOf('carbs_hr') < 0) {
                const key = entry.originalProfileName;
                const prof = Utils.findLast(data.profiles,
                  ((p) => Utils.isBefore(p.startDate, check) && p.store[key] != null));
                if (prof != null) {
                  entry.profileJson = `{"carbs_hr":${prof.store[key].carbsHr},${entry.profileJson.substring(1)}`;
                }
              }
            }
            let profile = entry.profileJson;
            if (store != null) {
              profile = JSON.stringify(store);
            }
            parts.push(`"store":{"${entry.profile}":${profile}},"startDate":"${entry.created_at}"`);
            parts.push(`"mills":"0","units":"mg/dl"`);
            parts.push(`"percentage":"${entry.percentage}"`);
            parts.push(`"duration":"${entry.duration}"`);
            parts.push(`"timeshift":"${entry.timeshift}"`);
            parts.push(`"created_at":"${entry.created_at}"}`);
            data.profiles.push(ProfileData.fromJson(JSON.parse(parts.join(','))));
            // if (store != null) {
            //   Utils.last(data.profiles).store[entry.profile] = store;
            // }
          }
        } catch (ex) {
          Log.devError(ex, this.msgProfileError);
        }
      }
    }
    this.ps.max = 5;
    this.ps.value = 1;
    this.ps.text = $localize`Sortiere Profile...`;
    data.profiles.sort((a, b) => Utils.compareDate(a.startDate, b.startDate));

    // calculate the duration of the profiles
    let i = 1;
    this.ps.value = 2;
    this.ps.text = $localize`Berechne Profillängen...`;
    while (i < data.profiles.length) {
      const last = data.profiles[i - 1];
      const current = data.profiles[i];
      const duration = Utils.differenceInSeconds(current.startDate, last.startDate);
      if (last.duration >= duration || last.duration === 0) {
        last.duration = duration;
      } else {
        if (baseProfile != null) {
          const temp = baseProfile.copy;
          temp.startDate = Utils.addTimeSeconds(last.startDate, last.duration);
          temp.createdAt = temp.startDate;
          temp.duration = Utils.differenceInSeconds(current.startDate, temp.startDate);
          data.profiles.splice(i, 0, temp);
        }
        i++;
      }
      if (current.isFromNS) {
        baseProfile = current;
      }
      i++;
    }
    if (baseProfile != null && Utils.last(data.profiles).duration > 0) {
      //    if (last.duration > 0 && data.profiles.length > 1) {
      // noinspection PointlessBooleanExpressionJS
      if (baseProfile != null) {
        const temp = baseProfile.copy;
        temp.startDate = Utils.addTimeSeconds(Utils.last(data.profiles).startDate, Utils.last(data.profiles).duration);
        temp.createdAt = temp.startDate;
        data.profiles.push(temp);
      }
    }

    if (Utils.isEmpty(data.profiles)) {
      data.profiles.push(new ProfileData());
    }

    Utils.last(data.profiles).duration =
      Utils.differenceInSeconds(GlobalsData.now, Utils.last(data.profiles)?.startDate ?? GlobalsData.now);

    this.ps.value = 3;
    this.ps.text = $localize`Sortiere berechnete Profile...`;
    data.profiles.sort((a, b) => Utils.compareDate(a.startDate, b.startDate));
    // String text = "";
    // for (ProfileData p in data.profiles)
    //   text = "${text}<div>${p.startDate}(${p.duration} min)=${p.current?.name}</div>";
    // message.dbgText = text;
    // remove all profiles with a length of 0
    this.ps.value = 4;
    this.ps.text = $localize`Entferne leere Profile...`;
    data.profiles = data.profiles.filter((p) => !(p.duration < 2 && p != Utils.last(data.profiles) && p.store['NR Profil'] == null));

    // add the previous day of the period to have the daydata available in forms that need this information
    begDate = Utils.addDateDays(begDate, -1);
    data.dayCount = -1;
    this.ps.value = 0;
    this.ps.max = Utils.differenceInDays(endDate, begDate)
    const info = isForThumbs ? `${GLOBALS.fmtDate(begDate)} - ${GLOBALS.fmtDate(endDate)}` : GLOBALS.period.display;
    this.ps.info = $localize`${info} für ${GLOBALS.user.name}`;
    this.reportData.deviceList = [];
    while (begDate <= endDate) {
      let hasData = false;
      if (GLOBALS.period.isDowActive(begDate.getDay())) {
        const beg = new Date(begDate.getFullYear(), begDate.getMonth(), begDate.getDate(), 0, 0, 0, 0);
        const end = new Date(begDate.getFullYear(), begDate.getMonth(), begDate.getDate(), 23, 59, 59, 999);
        const params = new ProfileParams();
        params.skipCache = true;
        const profile = data.profile(beg).profile;
        const profileBeg = Utils.addTimeHours(beg, -profile.store.timezone.localDiff);
        const profileEnd = Utils.addTimeHours(end, -profile.store.timezone.localDiff);

        this.ps.text = this.msgLoadingDataFor(Utils.fmtDate(begDate));
        const urlDate = new Date(begDate.getFullYear(), begDate.getMonth(), begDate.getDate());
        let reqParams: RequestParams = {};
        let url = GlobalsData.user.apiUrl(urlDate, 'entries.json',
          {
            params: `find[date][$gte]=${beg.getTime()}&find[date][$lte]=${end.getTime()}&count=100000`,
            reqParams: reqParams
          });
        let src = await this.ds.requestJson(url, reqParams);
        if (src != null) {
          Log.displayLink(`e${Utils.fmtDate(begDate)} (${src.length})`, url, {count: src.length, type: 'debug'});
          this.reportData.mustReload = false;
          for (const entry of src) {
            try {
              const e = EntryData.fromJson(entry);
              if (e.gluc > 0) {
                hasData = true;
                data.ns.entries.push(e);
              }
              if (e.mbg > 0) {
                hasData = true;
                data.ns.bloody.push(e);
              } else if (e.gluc <= 0) {
                hasData = true;
                data.ns.remaining.push(e);
              }

              const device = e.device ?? '';
              if (!this.reportData.deviceList.some(d => d === device)) {
                this.reportData.deviceList.push(device);
              }
            } catch (ex) {
              Log.devError(ex, `Fehler im Entry-Datensatz: ${entry.toString()}`);
              break;
            }
          }
        }
        if (data.lastTempBasal == null) {
          // find last temp basal of treatments of day before current day.
          const reqParams: RequestParams = {};
          url = data.user.apiUrl(urlDate, 'treatments.json',
            {
              params: `find[created_at][$lt]=${profileBeg.toISOString()}&find[created_at][$gt]=${Utils.addDateDays(profileBeg, -1).toISOString()}&count=100&find[eventType][$eq]=Temp%20Basal'`,
              reqParams: reqParams
            });
          src = await this.ds.requestJson(url, reqParams);
          if (src != null) {
            const list: TreatmentData[] = [];
            for (const treatment of src) {
              list.push(TreatmentData.fromJson(treatment));
            }
            list.sort((a, b) => Utils.compareDate(a.createdAt, b.createdAt));
            if (!Utils.isEmpty(list)) {
              data.lastTempBasal = list[list.length - 1];
            }
          }
        }
        reqParams = {};
        url = data.user.apiUrl(urlDate, 'treatments.json',
          {
            params: `find[created_at][$gte]=${profileBeg.toISOString()}&find[created_at][$lte]=${profileEnd.toISOString()}&count=100000`,
            reqParams: reqParams
          });
        src = await this.ds.requestJson(url, reqParams);
        let hasExercise = false;
        if (src != null) {
          Log.displayLink(`t${Utils.fmtDate(begDate)} (${src.length})`, url, {count: src.length, type: 'debug'});
          const temp: TreatmentData[] = [];
          for (const treatment of src) {
            hasData = true;
            const t = TreatmentData.fromJson(treatment);
            // Treatments entered by sync are ignored
            if (t.enteredBy === 'sync') {
            } else if (!Utils.isEmpty(data.ns.treatments) && t.equals(data.ns.treatments[data.ns.treatments.length - 1])) {
              // duplicate Treatments are removed
              temp[data.ns.treatments.length - 1].duplicates++;
            } else {
              temp.push(t);
            }
          }
          //   "created_at": "2024-08-22T04:57:33.360Z",
          //   "created_at": "2024-08-22T05:12:33.360Z",
          for (const t of temp) {
            // if the treatment is a bolus wizard entry there could exist an entry with the same timestamp
            // but as mealbolus. In this case the entry with the bolus wizard is skipped.
            if (t._carbs > 0 && t.isBolusWizard && temp.some(entry => entry.isMealBolus
              && entry.createdAt.getTime() === (t.createdAt.getTime() + t.bwpGlucoseDifference * 1000 * 60))) {
              continue;
            } else if (t.isExercise) {
              hasExercise = true;
            } else if (t.isBGCheck) {
              const entry = new EntryData();
              entry.id = t.id;
              entry.time = t.createdAt;
              entry.device = t.enteredBy;
              entry.type = 'mbg';
              entry.mbg = t.glucose * GLOBALS.glucFactor;
              entry.rawbg = t.glucose;
              data.ns.bloody.push(entry);
            }
            data.ns.treatments.push(t);
          }
        }
        // the following code inserts an exercise in the data if there is none present
        // if (g.isLocal && !hasExercise) {
        //   const t = TreatmentData();
        //   t.createdAt =
        //       DateTime(begDate.year, begDate.month, begDate.day, 10, 0, 0);
        //   t.duration = 120 * 60;
        //   t.eventType = 'exercise';
        //   t.notes = 'Bewegung (Testeintrag)';
        //   t.enteredBy = 'NR-Test';
        //   t.microbolus = 0;
        //   t.insulin = 0;
        //   t.microbolus = 0;
        //   t.isSMB = false;
        //   data.ns.treatments.add(t);
        // }
        reqParams = {};
        url = data.user.apiUrl(urlDate, 'devicestatus.json',
          {
            params: `find[created_at][$gte]=${profileBeg.toISOString()}&find[created_at][$lte]=${profileEnd.toISOString()}&count=100000`,
            reqParams: reqParams
          });
        src = await this.ds.requestJson(url, reqParams);
        if (src != null) {
          Log.displayLink(`ds${Utils.fmtDate(begDate)} (${src.length})`, url, {count: src.length, type: 'debug'});
          for (const devicestatus of src) {
            hasData = true;
            data.ns.devicestatusList.push(DeviceStatusData.fromJson(devicestatus));
          }
        }
        reqParams = {};
        url = data.user.apiUrl(urlDate, 'activity.json',
          {
            params: `find[created_at][$gte]=${profileBeg.toISOString()}&find[created_at][$lte]=${profileEnd.toISOString()}&count=100000`,
            reqParams: reqParams
          });
        src = await this.ds.requestJson(url, reqParams);
        if (src != null) {
          Log.displayLink(`ac${Utils.fmtDate(begDate)} (${src.length})`, url, {count: src.length, type: 'debug'});
          for (const activity of src) {
            const value = ActivityData.fromJson(activity);
            let exists = false;
            for (const check of data.ns.activityList) {
              if (check.equals(value)) {
                exists = true;
              }
            }
            if (!exists) {
              data.ns.activityList.push(value);
              // if(value.type === 'steps-total') {
              //   print('${begDate} ${value.createdAt.hour}:${value.createdAt.minute} - ${value.steps}');
              // }
            }
          }
        }
      }
      begDate = Utils.addDateDays(begDate, 1);
      if (hasData) {
        data.dayCount++;
      }
      if (!this.ps.next()) {
        return data;
      }
      // if (sendIcon != 'stop') return data;
    } // while begdate < enddate
    this.reportData.deviceFilter = this.reportData.deviceList;
    this.reportData.deviceDataList = this.reportData.deviceList;
    if (this.reportData.deviceList.length > 1) {
      if (GLOBALS.avoidSaveAndLoad) {
        this.reportData.deviceFilter = GLOBALS.deviceForShortcut?.split(',')?.map(e => e.trim()) ?? ['all'];
        this.reportData.deviceList = this.reportData.deviceFilter;
      } else {
        const dlg: IDialogDef = {
          type: DialogType.confirm,
          title: $localize`Bitte wählen`,
          buttons: [{title: $localize`Ok`, result: {btn: DialogResultButton.ok}}],
          chips: []
        };
        for (const device of this.reportData.deviceList) {
          dlg.chips.push({title: device, selected: false});
        }
        this.ps.isPaused = true;
        const title = $localize`Die Daten beinhalten Einträge, die mit verschiedenen Geräten erfasst wurden. Bitte die Geräte auswählen, deren Daten ausgewertet werden sollen. Wenn keine Geräte ausgewählt werden, werden die Daten zusammengefasst.`;
        const result = await firstValueFrom(this.ms.showDialog(dlg, title, true));
        this.ps.isPaused = false;
        this.reportData.deviceFilter = result.data.chips ?? [];
        if (Utils.isEmpty(this.reportData.deviceFilter)) {
          this.reportData.deviceFilter = ['all'];
          this.reportData.deviceList = ['all'];
        }
      }
      if (this.reportData.deviceFilter.length > 1 || this.reportData.deviceFilter[0] === 'all') {
        GLOBALS.pdfWarnings.showGlucSources = true;
      }
      if (this.reportData.deviceFilter.length >= 1 && this.reportData.deviceFilter[0] !== 'all') {
        data.ns.entries = data.ns.entries.filter(e => Utils.containsDevice(this.reportData.deviceFilter, e));
        data.ns.bloody = data.ns.bloody.filter(e => Utils.containsDevice(this.reportData.deviceFilter, e));
        data.ns.remaining = data.ns.remaining.filter(e => Utils.containsDevice(this.reportData.deviceFilter, e));
      }
      // else {
      //   const check = this.reportData.device.toLowerCase();
      //   data.ns.entries = data.ns.entries.filter(e => e.device.toLowerCase() === check);
      //   data.ns.bloody = data.ns.bloody.filter(e => e.device.toLowerCase() === check);
      //   data.ns.remaining = data.ns.remaining.filter(e => e.device.toLowerCase() === check);
      // }
      this.reportData.mustReload = true;
    }

//  if (sendIcon === 'stop') {
    this.ps.value = 1;
    this.ps.max = 6;
    this.ps.text = this.msgPreparingData;
    data.ns.entries.sort((a, b) => Utils.compareDate(a.time, b.time));
    if (!this.ps.next()) {
      return data;
    }
    data.ns.bloody.sort((a, b) => Utils.compareDate(a.time, b.time));
    if (!this.ps.next()) {
      return data;
    }
    data.ns.remaining.sort((a, b) => Utils.compareDate(a.time, b.time));
    if (!this.ps.next()) {
      return data;
    }
    data.ns.treatments.sort((a, b) => Utils.compareDate(a.createdAt, b.createdAt));
    if (!this.ps.next()) {
      return data;
    }
    data.ns.devicestatusList.sort((a, b) => Utils.compareDate(a.createdAt, b.createdAt));
    if (!this.ps.next()) {
      return data;
    }
    data.ns.activityList.sort((a, b) => Utils.compareDate(a.createdAt, b.createdAt));

    const listSensorChanges = data.ns.treatments.filter(t => t.isSensorChange);

    if (!this.ps.next()) {
      return data;
    }
    const diffTime = 5;
    // gaps between entries that span more than the given minutes
    // are not filled with entries
    const minGapKeep = 16;
    // Create an array with EntryData every [diffTime] minutes
    const entryList: EntryData[] = [];
    if (!Utils.isEmpty(data.ns.entries)) {
      let count = 0;
      for (const key of this.reportData.deviceList) {
        const entrySrcList = Utils.deviceEntries(data.ns.entries, key);
        count += entrySrcList.length;
        if (entrySrcList.length === 0) {
          continue;
        }
        let target = new Date(entrySrcList[0].time.getFullYear(), entrySrcList[0].time.getMonth(), entrySrcList[0].time.getDate());
        let prev = entrySrcList[0];
        const t = new Date(prev.time.getFullYear(), prev.time.getMonth(), prev.time.getDate());
        prev = new EntryData();
        prev.time = t;
        let next = new EntryData();
        next.time = target;
        // distribute entries
        this.ps.value = 0;
        this.ps.max = (entrySrcList?.length ?? 0) + 1;
        if (key === 'all' || this.reportData.deviceList.length === 1) {
          this.ps.text = $localize`Verarbeite Daten...`;
        } else {
          this.ps.text = $localize`Verarbeite Daten für ${key}...`;
        }
        for (const entry of entrySrcList) {
          if (this.ps.value % 10 === 0) {
            await Utils.refreshUI();
          }
          if (!this.ps.next()) {
            return data;
          }
          if (entry.isInvalid) {
            continue;
          }
          const current = new Date(entry.time.getFullYear(), entry.time.getMonth(), entry.time.getDate(), entry.time.getHours(), entry.time.getMinutes());
          if (Utils.isSameMoment(current, target)) {
            prev = entry;
            prev.time = current;
            entry.isCopy = true;
            entryList.push(entry);
            target = Utils.addTimeMinutes(target, diffTime);
          } else if (Utils.isBefore(current, target)) {
            next.slice(entry, next, 0.5);
          } else {
            next = entry.copy;
            const max = Utils.differenceInMinutes(current, prev.time);
            while (Utils.isAfter(current, target) || Utils.isSameMoment(current, target)) {
              const factor = max === 0 ? 0 : Utils.differenceInMinutes(target, prev.time) / max;
              next = next.copy;
              if (max >= minGapKeep || this.isAfterSensorChange(entry, listSensorChanges)) {
                next.isGap = true;
              }
              next.time = target;
              if (Utils.isSameMoment(current, target)) {
                next.isCopy = true;
                next.slice(entry, entry, 1.0);
              } else {
                next.slice(prev, entry, factor);
              }
              entryList.push(next);
              target = Utils.addTimeMinutes(target, diffTime);
            }
            prev = entry;
            prev.time = current;
            next = entry;
          }
        }
      }
    }
    data.calc.entries = entryList;
    data.calc.bloody = data.ns.bloody;
    data.calc.remaining = data.ns.remaining;

    // data.ns.treatments.removeWhere((t) => filterTreatment(t));
    data.calc.treatments = data.ns.treatments;
    data.calc.devicestatusList = data.ns.devicestatusList;
    data.calc.activityList = data.ns.activityList;

    const date = new Date(this.reportData.begDate.getFullYear(), this.reportData.begDate.getMonth(), this.reportData.begDate.getDate());
    let params = new ProfileParams();
    params.skipCache = true;
    params = this.reportData.profile(date, params);
    this.reportData.profiles.splice(0, params.lastIdx - 1);
    const msg = this.timeConsumingParts(data);
    let doFinalize = true;
    if (GLOBALS.ppShowDurationWarning && msg.length > 0) {
      const list = msg.map(t => `- ${t}`);
      list.splice(0, 0, $localize`Die Erstellung wird aus folgenden Gründen länger dauern:`);
      list.push($localize`Soll die Erstellung fortgesetzt werden?`);
      this.ps.isPaused = true;
      const result = await firstValueFrom(this.ms.warn(list, new DialogParams({
        beforeClose: () => {
          this.ps.isPaused = false;
        }
      })));
      if (result.btn === DialogResultButton.no) {
        doFinalize = false;
      }
    }
    if (doFinalize) {
      await this.extractData(data, data.data);
//    await firstValueFrom(this.extractData(data, data.calc));
//    await firstValueFrom(this.extractData(data, data.ns));
      if (!this.ps.data.isStopped) {
        data.isValid = true;
      }
    } else {
      this.ps.text = null;
    }

    this.showTimeoutMessage();
    return data;
  }

  showTimeoutMessage(msg?: string): void {
    if (!GLOBALS.ppShowSlowServerWarning && msg == null) {
      return;
    }
    let duration = 0;
    const servers: any = {};
    let hasTimeout = false;
    Log.msg['collect'].map(entry => {
      if (entry.id === 'timeout') {
        hasTimeout = true;
      }
      servers[entry.data.server] = (servers[entry.data.server] ?? 0) + entry.data.duration;
      duration += +entry.data.duration;
    });
    const info: string[] = [];
    if (hasTimeout) {
      info.push($localize`Der Zugriff auf den Nightscout-Server ist extrem langsam. Das
kann an einer fehlerhaften Konfiguration auf dem Server liegen oder an einer
schlechten Internetverbindung.`);
      info[0] += ' ' + Utils.plural(Object.keys(servers).length, {
        1: $localize`Die Daten wurden von folgendem Server geladen und die Antwort benötigte insgesamt die angegebene Zeit:`,
        other: $localize`Die Daten wurden von den folgenden Servern geladen und die Antwort benötigte insgesamt die angegebene Zeit:`
      });
      info.push('');
      for (const key of Object.keys(servers)) {
        info.push(`${key} - ${GLOBALS.fmtNumber(servers[key] / 1000, 2)} ` + $localize`Sekunden`);
      }
      info.push('');
      info.push($localize`Diese Meldung kann im Dialog Ausgabe Parameter deaktiviert werden.`);
    }

    if (hasTimeout || msg != null) {
      const type: IDialogDef = {
        type: DialogType.warning,
        title: $localize`Warnung`,
        buttons: [
          // {title: $localize`Ok`, result: {btn: DialogResultButton.ok}, icon: 'done'}
        ]
      };
      const params: DialogParams = new DialogParams();
      if (msg != null) {
        if (msg.startsWith('@settings@')) {
          type.buttons = [{result: {btn: 'settings'}, icon: 'settings', title: $localize`Einstellungen`}];
          msg = msg.substring(10);
        }
        info.splice(0, 0, msg, '');
        type.title = $localize`Fehler`;
        type.type = DialogType.error;
        params.theme = 'dlgError';
      }
      this.ms.showDialog(type, `${Utils.join(info, '<br>')}`, false, params).subscribe(result => {
        if (result?.btn === 'settings') {
          this.ms.showPopup(SettingsComponent, '', {});
        }
      });
    }
  }

  timeConsumingParts(data: ReportData): string[] {
    const ret: string[] = [];
    const max = 50;
    if (data.profiles.length >= max) {
      ret.push($localize`mehr als ${max} Profilwechsel (${data.profiles.length})`);
    }
    for (const cfg of GLOBALS.listConfig) {
      if (this.checkCfg(cfg)) {
        cfg.form.getTimeConsumingParts(data, ret);
      }
    }
    return ret;
  }

  isAfterSensorChange(entry: EntryData, listSensorChanges: TreatmentData[]): boolean {
    if (GLOBALS.ppSkipSensorChange === 0) {
      return false;
    }
    return listSensorChanges.find(t => {
      const diff = Utils.differenceInHours(entry.time, t.createdAt);
      // noinspection RedundantIfStatementJS
      if (diff >= 0 && diff <= GLOBALS.listSkipSensorChange[GLOBALS.ppSkipSensorChange].value) {
        return true;
      }
      return false;
    }) != null;
  }

  async extractData(data: ReportData, list: ListData) {
    list.catheterCount = 0;
    list.ampulleCount = 0;
    list.sensorCount = 0;
    list.khCount = 0.0;
    list.khAdjust = 0.0;
    list.khAdjustCount = 0;
    list.ieBolusSum = 0.0;
    list.ieMicroBolusSum = 0.0;
    const allEntries: EntryData[] = [];
    Utils.pushAll(allEntries, list.entries);
    Utils.pushAll(allEntries, list.bloody);
    Utils.pushAll(allEntries, list.remaining);
    allEntries.sort((a, b) => Utils.compareDate(a.time, b.time));
    if (Utils.isEmpty(allEntries)) {
      return;
    }

    let lastDay: Date = null;
    list.days = [];
    let params = new ProfileParams();
    this.ps.value = 0;
    this.ps.max = allEntries.length + 1;
    this.ps.text = 'Analysiere Daten...';
    for (const entry of allEntries) {
      if (this.ps.value % 100 === 0) {
        await Utils.refreshUI();
      }
      if (!this.ps.next() || entry.isInvalidOrGluc0) {
        continue;
      }
      data.profile(entry.time, params);
      const glucData = params.profile;
      if (lastDay == null || entry.time.getDate() != lastDay.getDate()) {
        list.days.push(new DayData(entry.time, glucData));
        lastDay = entry.time;
      }
      if (entry.type === 'mbg') {
        Utils.last(list.days).bloody.push(entry);
      } else {
        Utils.last(list.days).entries.push(entry);
      }
    }

    const check = new Date(list.days[0].date.getFullYear(), list.days[0].date.getMonth(), list.days[0].date.getDate() + 1);
    list.entries = list.entries.filter((e) => !Utils.isBefore(e.time, check));
    list.bloody = list.bloody.filter((e) => !Utils.isBefore(e.time, check));
    list.remaining = list.remaining.filter((e) => !Utils.isBefore(e.time, check));

    list.khCount = 0.0;
    list.ieBolusSum = 0.0;
    list.catheterCount = 0;
    list.ampulleCount = 0;
    list.sensorCount = 0;
    let eCarbs = 0.0;
    let delay = 0;
    list.treatments.sort((a, b) => Utils.compareDate(a.createdAt, b.createdAt));

    if (Utils.isEmpty(list.addList)) {
      let lastIdx = -1;
      for (let i = 0; i < list.treatments.length; i++) {
        const t1 = list.treatments[i];
        if (!t1.isTempBasal) {
          continue;
        }
        const t = lastIdx === -1 ? data.lastTempBasal : list.treatments[lastIdx];
        if (t == null) {
          continue;
        }
        lastIdx = i;

        const duration = Utils.differenceInSeconds(t1.createdAt, t.createdAt);
        // if duration of current treatment is longer than the difference between
        // next treatment and current treatment then cut the duration of current
        // treatment to the difference
        if (duration < t.duration) {
          t.duration = duration;
        }

        // if next treatment is in the next day, cut current duration so that the
        // end is at end of the day and insert a new treatment with the duration
        // up to the next treatment
        const date = Utils.addDateDays(t.createdAt, 1);
        if (date.getDate() === t1.createdAt.getDate() && date.getMonth() === t1.createdAt.getMonth() && date.getFullYear() === t1.createdAt.getFullYear()) {
          const newTreat = t.copy;
          newTreat.createdAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0);
          const duration = 86399 - t.timeForCalc;
          newTreat.duration -= duration;
          if (newTreat.duration > 0) {
            t.duration = duration;
            list.addList.push(newTreat);
          }
        }
      }
      if (!Utils.isEmpty(list.addList)) {
        Utils.pushAll(list.treatments, list.addList);
        list.treatments.sort((a, b) => Utils.compareDate(a.createdAt, b.createdAt));
      }
    }

    /**
     *  check all treatments for durations that span more than the day of the treatment
     */
    for (let i = 0; i < list.treatments.length; i++) {
      const t = list.treatments[i];
      const type = t.eventType.toLowerCase();
      if (type === 'note' && t.duration != null) {
        const until = new Date(t.createdAt.getTime() + t.duration * 1000);
        const check = new Date(t.createdAt.getTime());
        check.setHours(23, 59, 59);
        if (until.getTime() > check.getTime()) {
          // if a treatment is discovered cut the duration to the end of the day
          // and append a new treatment with a new duration to the list of treatments
          const t1 = t.copy;
          t1.createdAt = Utils.addDateDays(t1.createdAt, 1);
          t1.createdAt.setHours(0, 0, 0);
          t1.duration = (until.getTime() - check.getTime()) / 1000;
          t.duration = (check.getTime() - t.createdAt.getTime()) / 1000;
          list.treatments.push(t1);
        }
      }
    }
    list.treatments.sort((a, b) => Utils.compareDate(a.createdAt, b.createdAt));

    for (let i = 0; i < list.treatments.length; i++) {
      const t = list.treatments[i];
      const type = t.eventType.toLowerCase();
      if (t.isSiteChange) {
        list.catheterCount++;
      }
      if (t.isInsulinChange) {
        list.ampulleCount++;
      }
      if (t.isSensorChange) {
        list.sensorCount++;
      }
      if (type === 'note' && t.notes.toLowerCase().startsWith('ecarb')) {
        Log.todo('ListData.extractData muss noch überprüft werden', 'Ausgewerteter Wert:', t.notes);
        // const rex = /[^0-9\-]*(-*\d*)[^0-9\-]*(-*\d*)[^0-9\-]*(-*\d*).*/g;
        const rex = /[^0-9\-]*(?<eCarbs>-*\d*)[^0-9\-]*(?<egal>-*\d*)[^0-9\-]*(?<delay>-*\d*).*/;
        const matches = t.notes.match(rex);
        if (matches?.groups != null) {
          eCarbs = Utils.parseNumber(matches.groups['eCarbs']) ?? 0;
          delay = Utils.parseNumber(matches.groups['delay']) ?? 0;
          if (delay < 0) {
            for (let j = i - 1; j >= 0 && eCarbs > 0.0; j--) {
              const t1 = list.treatments[j];
              if (t1.isMealBolus && t1.carbs < 10.0) {
                eCarbs -= t1.carbs;
                t1.isECarb = true;
              }
            }
          }
        }
      }

      if (t.isMealBolus && eCarbs != null && eCarbs > 0.0 && t.carbs < 10.0) {
        eCarbs -= t.carbs;
        t.isECarb = true;
      }

      const idx = list.days.findIndex((d) => d.isSameDay(JsonData.toLocal(t.createdAt)));
      if (idx >= 0) {
        list.days[idx].treatments.push(t);
      }

      if (!data.isInPeriod(t.createdAt)) {
        continue;
      }

      list.khCount += t.carbs;
      list.ieBolusSum += t.bolusInsulin;
      list.ieMicroBolusSum += t.microbolus; // / 3600 * t.duration;
    }
    list.ieBasalSumDaily = 0.0;
    list.ieBasalSumStore = 0.0;
    for (let i = 1; i < list.days.length; i++) {
      const day = list.days[i];
      day.prevDay = i > 0 ? list.days[i - 1] : null;
      day.init((i < list.days.length - 1 ? list.days[i + 1] : null));

      list.ieBasalSumStore += day.ieBasalSum(true);
      list.ieBasalSumDaily += day.ieBasalSum(false);
      day.devicestatusList = [];
      Utils.pushAll(day.devicestatusList, list.devicestatusList.filter((ds) => day.isSameDay(JsonData.toLocal(ds.createdAt))));
      day.activityList = [];
      Utils.pushAll(day.activityList, list.activityList.filter((ac) => day.isSameDay(JsonData.toLocal(ac.createdAt))));
    }
    // the last day before the period was added at the beginning.
    // Now it has to be removed.
    if (!Utils.isEmpty(list.days) && Utils.isBefore(list.days[0].date, data.begDate)) {
      list.days.splice(0, 1);
    }

    // injectionList = InsulinInjectionList();
    // for (const day of days) {
    //   for (const t of day.treatments) {
    //     if (t.multipleInsulin != null) {
    //       injectionList = injectionList.add2List(t.multipleInsulin);
    //     }
    //   }
    // }
    this.calcStatistics(data, list);
  }

  calcStatistics(data: ReportData, list: ListData): void {
    list.stat = {
      low: new StatisticData(0, 0),
      norm: new StatisticData(0, 0),
      high: new StatisticData(0, 0),
      stdLow: new StatisticData(1, Settings.stdLow),
      stdNorm: new StatisticData(Settings.stdLow, Settings.stdHigh),
      stdHigh: new StatisticData(Settings.stdHigh, 9999),
      stdVeryHigh: new StatisticData(Settings.stdVeryHigh, 9999),
      stdNormHigh: new StatisticData(Settings.stdHigh, Settings.stdVeryHigh),
      stdNormLow: new StatisticData(Settings.stdVeryLow, Settings.stdLow),
      stdVeryLow: new StatisticData(0, Settings.stdVeryLow),
    };
    list.min = 999999.0;
    list.max = -1.0;
    let last: EntryData = null;
    // calculation of gvi and rms based on
    // https://github.com/nightscout/cgm-remote-monitor/blob/master/lib/report_plugins/glucosedistribution.js#L150
    list.gvi = 0.0;
    list.gviIdeal = 0.0;
    list.gviTotal = 0.0;
    let glucTotal = 0.0;
    let rmsTotal = 0.0;
    let firstGluc: number = null;
    let lastGluc: number = null;
    let usedRecords = 0;
    list.validCount = 0;

    for (const day of list.days) {
      for (const entry of day.entries) {
        const params = data.profile(entry.time);
        const glucData = params.profile;
        list.stat['low'].max = glucData.targetLow; // - 0.0001;
        list.stat['norm'].min = glucData.targetLow;
        list.stat['norm'].max = glucData.targetHigh; // + 0.0001;
        list.stat['high'].min = glucData.targetHigh;
        list.stat['high'].max = 9999.9999;
        // noinspection PointlessBooleanExpressionJS
        if (glucData != null) {
          const gluc = entry.gluc;
          if (gluc > 0) {
            list.validCount++;
            for (const key of Object.keys(list.stat)) {
              // if (gluc >= stat[key].min && gluc < stat[key].max)
              if (JsonData.isNorm(gluc, list.stat[key].min, list.stat[key].max)) {
                list.stat[key].add(entry, gluc);
              }
            }
            if (gluc < list.min) {
              list.min = entry.gluc;
            }
            if (gluc > list.max) {
              list.max = entry.gluc;
            }
          }
        }

        firstGluc ??= entry.gluc;
        lastGluc = entry.gluc;
        if (last == null) {
          glucTotal += entry.gluc;
        } else {
          const timeDelta = Utils.differenceInMilliseconds(entry.time, last.time);
          if (timeDelta <= 6 * 60000 && entry.gluc > 0 && last.gluc > 0) {
            usedRecords++;
            const delta = entry.gluc - last.gluc;
//          deltaTotal += delta;
//          total += delta;
//          if (delta >= t1)t1Count++;
//          if (delta >= t2)t2Count++;
            list.gviTotal += Math.sqrt(25 + Math.pow(delta, 2));
            glucTotal += entry.gluc;
            if (entry.gluc < glucData.targetLow) {
              rmsTotal += Math.pow(glucData.targetLow - entry.gluc, 2);
            }
            if (entry.gluc > glucData.targetHigh) {
              rmsTotal += Math.pow(entry.gluc - glucData.targetHigh, 2);
            }
          }
        }
        last = entry;
      }
    }

    let gviDelta = lastGluc - firstGluc;
    list.gviIdeal = Math.sqrt(Math.pow(usedRecords * 5, 2) + Math.pow(gviDelta, 2));
    list.gvi = list.gviIdeal != 0 ? list.gviTotal / list.gviIdeal : 0.0;
    list.rms = Math.sqrt(rmsTotal / usedRecords);
    let tirMultiplier = list.validCount === 0 ? 0.0 : list.stat['stdNorm'].values.length / list.validCount;
    list.pgs = list.gvi * (glucTotal / usedRecords) * (1.0 - tirMultiplier);

    for (const key of Object.keys(list.stat)) {
      list.stat[key].varianz = 0.0;
      for (const v of list.stat[key].values) {
        list.stat[key].varianz += Math.pow(v - list.stat[key].mid, 2);
      }
      list.stat[key].varianz /= list.stat[key].values.length;
    }
  }
}
