import {Injectable} from '@angular/core';
import {ReportData} from '@/_model/report-data';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {Utils} from '@/classes/utils';
import {ProgressService} from '@/_services/progress.service';
import {UserData} from '@/_model/nightscout/user-data';
import {UrlData} from '@/_model/nightscout/url-data';
import {DataNeeded} from '@/forms/base-print';
import {FormConfig} from '@/forms/form-config';
import {DataService} from '@/_services/data.service';
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
import {DialogType, IDialogDef} from '@/_model/dialog-data';
import {MessageService} from '@/_services/message.service';
import {firstValueFrom} from 'rxjs';

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
        zero: '',
        one: $localize`Der Uploader "${text}" hat die Datensätze angelegt.`,
        other: $localize`Folgende Uploader haben die Datensätze angelegt: ${text}`
      },);
  }

  msgLoadingDataFor(date: string): string {
    return $localize`:displayed when data of a day is loading:Lade Daten für ${date}...`;
  }

  checkCfg(cfg: FormConfig): boolean {
    return cfg.checked && (!cfg.form.isDebugOnly || GLOBALS.isDebug) && (!cfg.form.isLocalOnly || GLOBALS.isLocal);
  }

  async loadData(isForThumbs: boolean) {
    Log.clear();
    this.ps.init({
      progressPanelBack: this.ts.currTheme.outputparamsHeaderBack,
      progressPanelFore: this.ts.currTheme.outputparamsHeaderFore,
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
      this.ps.text = this.msgPreparingPDF;
      this.ps.max = 1;
      this.ps.value = 0;
      this.reportData.calc.calcStatistics(this.reportData);
      this.reportData.ns.calcStatistics(this.reportData);
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
        if (needed.status.anybody || user === GlobalsData.user) {
          this.ps.text = this.msgLoadingDataFor(user.name);
          try {
            const url = user.apiUrl(null, 'status.json');
            Log.displayLink('status', url, {type: 'debug'});
            const content = await this.ds.requestJson(url, {showError: false});
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
      GlobalsData.user.status = null;
      try {
        const url = GlobalsData.user.apiUrl(null, 'status.json');
        const content = await this.ds.requestJson(url, {showError: false});
        if (content != null) {
          GlobalsData.user.status = StatusData.fromJson(content);
        }
      } catch (ex) {
        console.error(ex);
        GlobalsData.user.status = null;
      }
      GlobalsData.user.isReachable = GlobalsData.user.status != null;
    }

    if (!needed.needsData || !GLOBALS.user.isReachable) {
      console.log('Schaut schlecht aus', needed, GLOBALS.user);
      setTimeout(() => this.ms.info('Abbruch, weil der Benutzer nicht erreichbar ist.'), 10);
      this.ps.cancel();
      return data;
    }

    // const bd = new Date(data.begDate.getFullYear(), data.begDate.getMonth(), data.begDate.getDate());
    // const ed = new Date(data.endDate.getFullYear(), data.endDate.getMonth(), data.endDate.getDate());

    let begDate = data.begDate;
    let endDate = data.endDate;

    // g.msg.links = [];
    // g.msg.type = 'msg toggle-debug';

    let url = data.user.apiUrl(endDate, 'status.json');
    Log.displayLink($localize`status`, url, {type: 'debug'});
    let content = await this.ds.requestJson(url);
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
      url = urlData.fullUrl('profile.json', `count=${maxCount}`);
      content = await this.ds.requestJson(url);
      while (content == null && data.user.profileMaxIdx < GLOBALS.profileMaxCounts.length - 1) {
        data.user.profileMaxIdx++;
        maxCount = GLOBALS.profileMaxCounts[data.user.profileMaxIdx];
        url = urlData.fullUrl('profile.json', `count=${maxCount}`);
        content = await this.ds.requestJson(url);
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
              if (uploaders.indexOf(profile.enteredBy) < 0) {
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
      url = urlData.fullUrl('treatments.json', params);
      content = await this.ds.requestJson(url);
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
            parts.push(`{"_id":"${entry._id}","defaultProfile":"${entry.profile}"`);
            // some uploaders (e.g. Minimed 600-series) don't save profileJson, so we need
            // to find it here
            let store: ProfileStoreData;
            if (entry.profileJson == null) {
              let key = entry.profile;
              const prof = Utils.findLast(data.profiles, ((p) => Utils.isBefore(p.startDate, check) && p.store[key] != null));
              if (prof != null) {
                store = prof.store[key];
              }
            }
            parts.push(`"store":{"${entry.profile}":${entry.profileJson}},"startDate":"${entry.created_at}"`);
            parts.push(`"mills":"0","units":"mg/dl"`);
            parts.push(`"percentage":"${entry.percentage}"`);
            parts.push(`"duration":"${entry.duration}"`);
            parts.push(`"timeshift":"${entry.timeshift}"`);
            parts.push(`"created_at":"${entry.created_at}"}`);

            data.profiles.push(ProfileData.fromJson(JSON.parse(parts.join(','))));
            if (store != null) {
              Utils.last(data.profiles).store[entry.profile] = store;
            }
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
    while (begDate <= endDate) {
      let hasData = false;
      if (GLOBALS.period.isDowActive(begDate.getDay())) {
        const beg = new Date(begDate.getFullYear(), begDate.getMonth(), begDate.getDate(), 0, 0, 0, 0);
        const end = new Date(begDate.getFullYear(), begDate.getMonth(), begDate.getDate(), 23, 59, 59, 999);
        const profile = data.profile(beg);
        const profileBeg = Utils.addTimeHours(beg, -profile.store.timezone.localDiff);
        const profileEnd = Utils.addTimeHours(end, -profile.store.timezone.localDiff);

        this.ps.text = this.msgLoadingDataFor(Utils.fmtDate(begDate));
        const urlDate = new Date(begDate.getFullYear(), begDate.getMonth(), begDate.getDate());
        let url = GlobalsData.user.apiUrl(urlDate, 'entries.json',
          {
            params: `find[date][$gte]=${beg.getTime()}&find[date][$lte]=${end.getTime()}&count=100000`
          });
        let src = await this.ds.requestJson(url);
        if (src != null) {
          Log.displayLink(`e${Utils.fmtDate(begDate)} (${src.length})`, url, {count: src.length, type: 'debug'});
          this.reportData.deviceList = [];
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
              if (this.reportData.deviceList.find(d => d === device) == null) {
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
          url = data.user.apiUrl(urlDate, 'treatments.json',
            {
              params: `find[created_at][$lt]=${profileBeg.toISOString()}&find[created_at][$gt]=${Utils.addDateDays(profileBeg, -1).toISOString()}&count=100&find[eventType][$eq]=Temp%20Basal'`
            });
          src = await this.ds.requestJson(url);
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
        url = data.user.apiUrl(urlDate, 'treatments.json',
          {params: `find[created_at][$gte]=${profileBeg.toISOString()}&find[created_at][$lte]=${profileEnd.toISOString()}&count=100000`});
        src = await this.ds.requestJson(url);
        let hasExercise = false;
        if (src != null) {
          Log.displayLink(`t${Utils.fmtDate(begDate)} (${src.length})`, url, {count: src.length, type: 'debug'});
          for (const treatment of src) {
            hasData = true;
            const t = TreatmentData.fromJson(treatment);
            // Treatments entered by sync are ignored
            if (t.enteredBy === 'sync') {
            } else if (!Utils.isEmpty(data.ns.treatments) && t.equals(data.ns.treatments[data.ns.treatments.length - 1])) {
              // duplicate Treatments are removed
              data.ns.treatments[data.ns.treatments.length - 1].duplicates++;
            } else {
              data.ns.treatments.push(t);
              if (t.isExercise) {
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
            }
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
        url = data.user.apiUrl(urlDate, 'devicestatus.json',
          {
            params: `find[created_at][$gte]=${profileBeg.toISOString()}&find[created_at][$lte]=${profileEnd.toISOString()}&count=100000`
          });
        src = await this.ds.requestJson(url);
        if (src != null) {
          Log.displayLink(`ds${Utils.fmtDate(begDate)} (${src.length})`, url, {count: src.length, type: 'debug'});
          for (const devicestatus of src) {
            hasData = true;
            data.ns.devicestatusList.push(DeviceStatusData.fromJson(devicestatus));
          }
        }
        url = data.user.apiUrl(urlDate, 'activity.json',
          {
            params: `find[created_at][$gte]=${profileBeg.toISOString()}&find[created_at][$lte]=${profileEnd.toISOString()}&count=100000`
          });
        src = await this.ds.requestJson(url);
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
    if (this.reportData.deviceList.length > 1) {
      const dlg: IDialogDef = {
        type: DialogType.confirm,
        title: $localize`Bitte wählen`,
        buttons: [{title: $localize`Alle`, result: {btn: null}}]
      };
      for (const device of this.reportData.deviceList) {
        dlg.buttons.push({title: device, result: {btn: device}});
      }
      this.ps.isPaused = true;
      const title = $localize`Die Daten beinhalten Einträge, die mit verschiedenen Geräten erfasst wurden. Bitte den Button für das Gerät betätigen, dessen Daten ausgewertet werden sollen.`;
      const result = await firstValueFrom(this.ms.showDialog(dlg, title, true));
      this.ps.isPaused = false;
      this.reportData.device = result.btn;
      if (this.reportData.device != null) {
        data.ns.entries = data.ns.entries.filter(e => e.device === this.reportData.device);
        data.ns.bloody = data.ns.bloody.filter(e => e.device === this.reportData.device);
        data.ns.remaining = data.ns.remaining.filter(e => e.device === this.reportData.device);
      }
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
      let target = new Date(data.ns.entries[0].time.getFullYear(), data.ns.entries[0].time.getMonth(), data.ns.entries[0].time.getDate());
      let prev = data.ns.entries[0];
      const t = new Date(prev.time.getFullYear(), prev.time.getMonth(), prev.time.getDate());
      prev = new EntryData();
      prev.time = t;
      let next = new EntryData();
      next.time = target;
      // distribute entries
      this.ps.value = 0;
      this.ps.max = data.ns?.entries?.length + 9
      this.ps.text = $localize`Bereinige Daten...`;
      for (const entry of data.ns.entries) {
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
    data.calc.entries = entryList;
    data.calc.bloody = data.ns.bloody;
    data.calc.remaining = data.ns.remaining;

    // data.ns.treatments.removeWhere((t) => filterTreatment(t));
    data.calc.treatments = data.ns.treatments;
    data.calc.devicestatusList = data.ns.devicestatusList;
    data.calc.activityList = data.ns.activityList;

    if (!this.ps.next()) {
      return data;
    }
    data.calc.extractData(data);
    if (!this.ps.next()) {
      return data;
    }
    data.ns.extractData(data);
    if (!this.ps.next()) {
      return data;
    }
    data.isValid = true;
    return data;
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
}
