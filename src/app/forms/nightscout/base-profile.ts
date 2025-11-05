import {ProfileEntryData} from '@/_model/nightscout/profile-entry-data';
import {BasePrint} from '@/forms/base-print';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {ReportData} from '@/_model/report-data';
import {Utils} from '@/classes/utils';
import {PageData} from '@/_model/page-data';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {ProfileGlucData, ProfileParams} from '@/_model/nightscout/profile-gluc-data';
import {TreatmentData} from '@/_model/nightscout/treatment-data';
import {DayData} from '@/_model/nightscout/day-data';

export class CalcData {
  firstGluc = 0.0;
  firstTime = 0;
  lastTime = 0;
  bolusTime = 0;
  glucMax = 0;
  brBolusTime: number;
  endDate: Date;
  nextBRTimes: ProfileEntryData[] = [];
}

export abstract class BaseProfile extends BasePrint {
  static namedProfileName = 'NR Profil';
  onlyLast: boolean;
  namedProfile: boolean;
  override params: ParamInfo[] = [];
  mayShowBothUnits = true;
  profStartTime: Date;
  profEndTime: Date;

  protected constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  get msgNoChange(): string {
    return $localize`Keine Änderung`;
  }

  override get isPortrait(): boolean {
    return false;
  }

  get isSingleDay(): boolean {
    return this.profEndTime != null && Utils.differenceInHours(this.profEndTime, this.profStartTime) < 24;
  }

  static msgNamedProfile(name: string): string {
    return $localize`Profil "${name}" verwenden`;
  }

  msgNoNameHelp(name: string): string {
    return $localize`Das Profil mit dem Namen "${name}" wurde nicht gefunden.
        Das muss im Profileditor auf der Nightscout Seite eingerichtet werden. Dort muss ein Profil eingerichtet werden,
        das den Namen "${name}" hat, um dieses Formular erzeugen zu können. Mit dem Link unten wird
        der Profileditor aufgerufen. Unter Umständen muss dort dann noch ganz unten auf der Seite die
        Authentifizierung durchgeführt werden, um die Werte ändern zu können.`;
  }

  msgProfileSwitch(oldName: string, newName: string): string {
    return $localize`Profilwechsel - ${oldName} => ${newName}`;
  }

  msgProfileSwitchDuration(oldName: string, newName: string, duration: number): string {
    return $localize`Profilwechsel - ${oldName} => ${newName} für ${duration} Minuten`;
  }

  msgChangedEntry(name: string, from: string, to: string): string {
    return `${name} ${from} => ${to}`;
  }

  override hasData(src: ReportData): boolean {
    return !Utils.isEmpty(src.profiles);
  }

  getEmptyPage(): PageData {
    this.subtitle = BaseProfile.namedProfileName;
    const url = GLOBALS.user.apiUrl(null, 'PROFILE', {noApi: true});
    const ret = [
      this.headerFooter(),
      {
        margin: [this.cm(this.xorg), this.cm(this.yorg), this.cm(this.xorg), this.cm(0)],
        text: this.msgNoNameHelp(BaseProfile.namedProfileName)
      },
      {
        margin: [this.cm(this.xorg), this.cm(1), this.cm(this.xorg), this.cm(0)],
        text: url,
        bold: true,
        color: 'blue'
      }
    ];
    return new PageData(this.isPortrait, ret);
  }

  override fillPages(pages: PageData[]): void {
    const pageList: PageData[] = [];
    if (this.namedProfile) {
      const data = this.repData.namedProfile(BaseProfile.namedProfileName);
      if (data == null) {
        pages.push(this.getEmptyPage());
        return;
      }
      this.profStartTime = data.store.startDate ?? GlobalsData.now;
      const page = this.getPage(0, data, new CalcData());
      if (page != null) {
        pageList.push(page);
        if (GLOBALS.showBothUnits && this.mayShowBothUnits) {
          GLOBALS.glucMGDLIdx = 1;
          pageList.push(this.getPage(0, data, new CalcData()));
          GLOBALS.glucMGDLIdx = 2;
        }
      }
      Utils.pushAll(pages, pageList);
      return;
    }
    // List<String> dbg = List<String>();
    // for(ProfileData p in src.profiles)
    //   dbg.add("${fmtDateTime(p.startDate)} - ${p.duration}");
    const startDate = new Date(this.repData.begDate.getFullYear(), this.repData.begDate.getMonth(), this.repData.begDate.getDate());
    const endDate = new Date(this.repData.endDate.getFullYear(), this.repData.endDate.getMonth(), this.repData.endDate.getDate() + 1);
    const profiles = this.repData.profiles;
    const _alreadyDone: string[] = [];
    let lastIdx = -1;
    // Log.info(`Report ${this.fmtDate(this.repData.begDate)} - ${this.fmtDate(this.repData.endDate)}`);
    for (let i = 0; i < this.repData.profiles.length; i++) {
      // print(repData.profiles[i].current.name);
      this.profStartTime = this.repData.profiles[i].startDate ?? GlobalsData.now;
      if (i < this.repData.profiles.length - 1) {
        this.profEndTime = Utils.addTimeMinutes(this.repData.profiles[i + 1].startDate, -1);
      } else {
        this.profEndTime = null;
      }

      // if profileendtime is before reportstartdate then skip profile
      if (this.profEndTime != null && Utils.isBefore(this.profEndTime, startDate)) {
        continue;
      }
      // if profilestarttime is after reportenddate then skip profile
      if (Utils.isAfter(this.profStartTime, endDate)) {
        continue;
      }
      let done = false;
      const calc = new CalcData();
      if (i < this.repData.profiles.length - 1) {
        calc.nextBRTimes = this.repData.profiles[i + 1].current?.listBasal;
        calc.endDate = Utils.addDateDays(this.repData.profiles[i + 1].startDate, -1);
        if (Utils.differenceInHours(startDate, this.repData.profiles[i + 1].startDate) >= 0) {
          continue;
        }
      } else {
        calc.nextBRTimes = this.repData.profiles[i].current?.listBasal;
        calc.endDate = null;
      }

      if (this.namedProfile && this.repData.profiles[i].current?.name != BaseProfile.namedProfileName) {
        continue;
      }

      const hash = this.repData.profiles[i].current?.hash;
      if (_alreadyDone.includes(hash)) {
        continue;
      }
      _alreadyDone.push(hash);

      lastIdx = pageList.length;
      for (let p = 0; !done; p++) {
        const params = new ProfileParams();
        params.doMix = false;
        const data = this.repData.profile(profiles[i].startDate, params).profile;
        const page = this.getPage(p, data, calc);
        done = page == null;
        if (!done) {
          pageList.push(page);
          if (GLOBALS.showBothUnits && this.mayShowBothUnits) {
            GLOBALS.glucMGDLIdx = 1;
            pageList.push(this.getPage(p, data, calc));
            GLOBALS.glucMGDLIdx = 2;
          }
        }
      }
    }

    if (pageList.length === 0) {
      pageList.push(new PageData(this.isPortrait, [
        this.headerFooter(),
        {
          margin: [this.cm(this.xorg), this.cm(this.yorg - 0.5), this.cm(0), this.cm(0)],
          text: $localize`Es konnten keine Profile geladen werden. Es kann sein, dass die Profiltabelle zu viele Einträge beinhaltet.
          In diesem Falle kann es helfen, wenn in den Einstellungen die "Maximale Anzahl an Profildatensätzen" herabgesetzt wird.`,
          color: this.colWarning
        }]));
    }

    if ((this.onlyLast || this.repData.isForThumbs) && !Utils.isEmpty(pageList)) {
      pageList.splice(0, lastIdx);
    }

    Utils.pushAll(pages, pageList);
  }

  isSingleDayRange(startTime: Date, endTime: Date): boolean {
    if (Utils.isAfter(startTime, this.profEndTime)) {
      return false;
    } else if (Utils.isBefore(endTime, this.profStartTime)) {
      return false;
    }
    return true;
  }

  getProfileSwitch(src: ReportData, day: DayData, t: TreatmentData, showDetails: boolean): string {
    const ret: string[] = [];
    const before = src.profile(Utils.addDateDays(t.createdAt, -1)).profile;
    const current = src.profile(t.createdAt).profile;
    if (t.duration > 0) {
      ret.push(this.msgProfileSwitchDuration(before.store.name, current.store.name, Math.floor(t.duration / 60)));
    } else {
      ret.push(this.msgProfileSwitch(before.store.name, current.store.name));
    }

    if (!showDetails) {
      return ret.join('\n');
    }

    if (before.store.dia != current.store.dia) {
      ret.push(this.msgChangedEntry(
        this.msgDIA, `${GLOBALS.fmtNumber(before.store.dia, 2)} ${this.msgDIAUnit}`,
        `${GLOBALS.fmtNumber(current.store.dia, 2)} ${this.msgDIAUnit}`));
    }
    if (before.store.carbsHr != current.store.carbsHr) {
      ret.push(this.msgChangedEntry(
        this.msgKHA, `${GLOBALS.fmtNumber(before.store.carbsHr)} ${this.msgKHAUnit}`,
        `${GLOBALS.fmtNumber(current.store.carbsHr)} ${this.msgKHAUnit}`));
    }

    const temp: string[] = [];
    temp.push(this.msgTargetTitle);
    if (current.store.listTargetHigh.length === current.store.listTargetLow.length) {
      for (let i = 0; i < current.store.listTargetHigh.length; i++) {
        const currHigh = current.store.listTargetHigh[i];
        const currLow = current.store.listTargetLow[i];
        const highTime = currHigh.time(day.date);
        const lowTime = currLow.time(day.date);
        if (highTime != lowTime) {
          continue;
        }
        let lowChanged = false;
        let highChanged = false;

        let oldLow: number;
        let oldHigh: number;
        let idx = before.store.listTargetLow.findIndex((entry) => entry.time(day.date) === lowTime);
        if (idx < 0) {
          lowChanged = true;
        } else {
          lowChanged = before.store.listTargetLow[idx].value != currLow.value;
        }
        if (lowChanged && idx >= 0) {
          oldLow = before.store.listTargetLow[idx].value;
        }
        idx = before.store.listTargetHigh.findIndex((entry) => entry.time(day.date) === highTime);
        if (idx < 0) {
          highChanged = true;
        } else {
          highChanged = before.store.listTargetHigh[idx].value != currHigh.value;
        }
        if (highChanged && idx >= 0) {
          oldHigh = before.store.listTargetHigh[idx].value;
        }
        if (lowChanged || highChanged) {
          if (oldLow == null || oldHigh == null) {
            temp.push($localize`ab ${GLOBALS.fmtTime(highTime, {withUnit: true})} neuer Bereich ${GLOBALS.fmtBasal(currLow.value)} - ${GLOBALS.fmtBasal(currHigh.value)}`);
          } else {
            temp.push($localize`ab ${GLOBALS.fmtTime(highTime, {withUnit: true})} ${oldLow} - ${GLOBALS.fmtBasal(oldHigh)} => ${currLow.value} - ${GLOBALS.fmtBasal(currHigh.value)}`);
          }
        }
      }
      if (temp.length > 1) {
        Utils.pushAll(ret, temp);
      }

      this.getProfileEntriesChanged(ret, day, this.msgBasalTitle, current.store.listBasal, before.store.listBasal);
      this.getProfileEntriesChanged(ret, day, this.msgISFTitle, current.store.listSens, before.store.listSens);
      this.getProfileEntriesChanged(ret, day, this.msgICRTitle, current.store.listCarbratio, before.store.listCarbratio);
    }

    if (ret.length === 1) {
      ret.push(this.msgNoChange);
    }

    return ret.join('\n');
  }

  getProfileEntriesChanged(list: string[], day: DayData, title: string, current: ProfileEntryData[], before: ProfileEntryData[]): void {
    const ret: string[] = [];
    for (let i = 0; i < current.length; i++) {
      const entry = current[i];
      const time = current[i].time(day.date);
      const old = before.find((entry) => entry.time(day.date) === time);
      let hasChanged = false;
      if (old == null) {
        hasChanged = true;
      } else if (old.value != entry.value) {
        hasChanged = true;
      }
      if (hasChanged) {
        if (old == null) {
          ret.push($localize`ab ${GLOBALS.fmtTime(time, {withUnit: true})}\: neuer Wert ${GLOBALS.fmtBasal(entry?.value)}`);
        } else if (entry == null) {
          ret.push($localize`ab ${GLOBALS.fmtTime(time, {withUnit: true})}\: ${GLOBALS.fmtBasal(old.value)} gelöscht`);
        } else {
          ret.push($localize`ab ${GLOBALS.fmtTime(time, {withUnit: true})}\: ${GLOBALS.fmtBasal(old.value)} => ${GLOBALS.fmtBasal(entry.value)}`);
        }
      }
    }
    if (!Utils.isEmpty(ret)) {
      list.push(title);
      Utils.pushAll(list, ret);
    }
  }

  abstract getPage(page: number, profile: ProfileGlucData, calc: CalcData): PageData;
}
