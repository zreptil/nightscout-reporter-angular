import {JsonData, Uploader} from '@/_model/json-data';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {InsulinInjectionData} from '@/_model/nightscout/insulin-injection-data';
import {Log} from '@/_services/log.service';
import {BoluscalcData} from '@/_model/nightscout/bolus-calc-data';
import {CalcIOBData} from '@/_model/nightscout/calc-iob-data';
import {ProfileGlucData} from '@/_model/nightscout/profile-gluc-data';
import {Utils} from '@/classes/utils';
import {DayData} from '@/_model/nightscout/day-data';
import {ReportData} from '@/_model/report-data';
import {Settings} from '@/_model/settings';

export class TreatmentData extends JsonData {
  raw: any;
  id: string;
  eventType: string;
  duration: number; // duration in seconds
  timeshift: number;
  _percent: number;
  _absolute: number;
  _rate: number;
  bwpGlucoseDifference: number;
  createdAt: Date;
  enteredBy: string;
  NSClientId: string;
  insulin: number;
  microbolus: number;
  insulinInjections: InsulinInjectionData[] = [];
  splitExt: number;
  splitNow: number;
  isSMB: boolean;
  duplicates = 1;
  pumpId: string;
  glucose: number;
  glucoseType: string;
  boluscalc: BoluscalcData;
  notes: string;
  reason: string;
  targetTop: number
  targetBottom: number;
  isECarb = false;

  constructor() {
    super();
  }

  _carbs: number;

  get carbs(): number {
    // switch (eventType.toLowerCase())
    // {
    //   case 'bolus wizard':
    //   case 'meal bolus':
    //   case 'carb correction':
    //   case 'carbs':
    //     if (_carbs != null && !isECarb)return _carbs;
    //     break;
    //   case '<none>':
    //     if (enteredBy.startsWith('xdrip') && _carbs != null && !isECarb)return _carbs;
    //     break;
    // }
    if (this._carbs != null && !this.isECarb) {
      return this._carbs;
    }
    return 0.0;
  }

  _key600: string;

  get key600(): string {
    return this._key600 ?? '';
  }

  get isBloody(): boolean {
    return this.glucoseType?.toLowerCase() === 'finger' || this.eventType.toLowerCase() === 'bg check';
  }

  _from: Uploader = Uploader.Unknown;

  get from(): Uploader {
    if (this._from === Uploader.Unknown) {
      const check = this.enteredBy?.toLowerCase() ?? '';
      if (check === 'openaps') {
        this._from = Uploader.OpenAPS;
      } else if (check === 'tidepool') {
        this._from = Uploader.Tidepool;
      } else if (check.indexOf('androidaps') >= 0) {
        this._from = Uploader.AndroidAPS;
      } else if (check.startsWith('xdrip')) {
        this._from = Uploader.XDrip;
      } else if (check === 'spike') {
        this._from = Uploader.Spike;
      }
    }
    return this._from;
  }

  get timeForCalc(): number {
    return this.createdAt.getHours() * 3600 + this.createdAt.getMinutes() * 60 + this.createdAt.getSeconds();
  }

  get _t(): string {
    return this.eventType.toLowerCase();
  }

  get hasNoType(): boolean {
    return this._t === '<none>' || this._t === '';
  }

  get isSiteChange(): boolean {
    return this._t === 'site change';
  }

  get isInsulinChange(): boolean {
    return this._t === 'insulin change';
  }

  get isSensorChange(): boolean {
    return this._t === 'sensor change' || this._t === 'sensor start';
  }

  get isPumpBatteryChange(): boolean {
    return this._t === 'pump battery change';
  }

  get isProfileSwitch(): boolean {
    return this._t === 'profile switch';
  }

  get isTempTarget(): boolean {
    return this._t === 'temporary target';
  }

  get isTempBasal(): boolean {
    return this._t === 'temp basal';
  }

  get isExercise(): boolean {
    return this._t === 'exercise';
  }

  get isBGCheck(): boolean {
    return this._t === 'bg check';
  }

  get isMealBolus(): boolean {
    return this._t === 'meal bolus' || this._t === 'carb correction';
  }

  get isBolusWizard(): boolean {
    return this._t === 'bolus wizard';
  }

  get isTempOverride(): boolean {
    return this._t === 'temporary override';
  }

  get absoluteTempBasal(): number {
    return this._absolute;
  }

  get eCarbs(): number {
    return this.isECarb ? this._carbs : 0.0;
  }

  get isCarbBolus(): boolean {
    if (this.isMealBolus) {
      return true;
    }
    // noinspection RedundantIfStatementJS
    if (this.isBolusWizard && this.carbs > 0) {
      return true;
    }

    return false;
  }

  get bolusInsulin(): number {
    return this.insulin ?? 0.0;
  }

  get copy(): TreatmentData {
    const ret = new TreatmentData();
    ret.fillFrom(this);
    ret.createdAt = new Date();
    ret.createdAt.setTime(this.createdAt.getTime());
    ret.boluscalc = this.boluscalc == null ? null : this.boluscalc.copy;
    ret.insulinInjections = [];
    for (const entry of this.insulinInjections) {
      ret.insulinInjections.push(entry.copy);
    }
    return ret;
  }

  static fromJson(json: any): TreatmentData {
    const ret = new TreatmentData();
    if (json == null) {
      return ret;
    }
    ret.raw = json;
    ret.id = JsonData.toText(json._id);
    ret.eventType = JsonData.toText(json.eventType);
    ret.duration = JsonData.toNumber(json.duration) * 60; // duration is saved in minutes
    ret.timeshift = JsonData.toNumber(json.timeshift);
    ret._percent = JsonData.toNumber(json.percent, null);
    ret._absolute = JsonData.toNumber(json.absolute, null);
    ret._rate = JsonData.toNumber(json.rate);
    // in aaps 3.0beta the rate is delivered as integer percentage, not
    // as fraction. So this has to be recalculated when this version is
    // detected. Currently it can be detected by having the attribute
    // isAbsolute in the data.
    if (json.isAbsolute != null) {
      ret._rate /= 100;
    }
    ret.createdAt = JsonData.toDate(json.created_at);
    ret.enteredBy = JsonData.getUploadSource(json);
    ret.NSClientId = JsonData.toText(json.NSCLIENT_ID);
    ret._carbs = JsonData.toNumber(json.carbs);
    ret.insulin = JsonData.toNumber(json.insulin);
    if (ret.insulin === 0.0) {
      ret.insulin = JsonData.toNumber(json.enteredinsulin);
    }
    ret.splitExt = JsonData.toNumber(json.splitExt);
    ret.splitNow = JsonData.toNumber(json.splitNow);
    ret.isSMB = JsonData.toBool(json.isSMB);
    ret.pumpId = JsonData.toText(json.pumpId);
    ret.glucoseType = JsonData.toText(json.glucoseType);
    if (json.boluscalc != null) {
      ret.boluscalc = BoluscalcData.fromJson(json.boluscalc);
    }
    ret.notes = JsonData.toText(json.notes);
    ret.reason = JsonData.toText(json.reason);
    ret.targetTop = JsonData.toNumber(json.targetTop);
    ret.targetBottom = JsonData.toNumber(json.targetBottom);

    let temp = JsonData.toText(json.units);
    if (temp.toLowerCase() === Settings.msgUnitMGDL.toLowerCase() && !GLOBALS.glucMGDLFromStatus) {
      ret.targetTop = ret.targetTop / 18.02;
      ret.targetBottom = ret.targetBottom / 18.02;
    } else if (temp.toLowerCase() === Settings.msgUnitMMOL.toLowerCase() && GLOBALS.glucMGDLFromStatus) {
      ret.targetTop = ret.targetTop * 18.02;
      ret.targetBottom = ret.targetBottom * 18.02;
    }

    ret.microbolus = 0.0;
    temp = JsonData.toText(json.insulinInjections);
    let list = [];
    try {
      list = JSON.parse(temp);
      // ignore: empty_catches
    } catch (ex) {
    }
    for (const entry of list) {
      ret.insulinInjections.push(InsulinInjectionData.fromJson(entry));
    }

    ret.glucose = JsonData.toNumber(json.glucose);
    if (json.units != null) {
      if (json.units.toLowerCase() === Settings.msgUnitMGDL.toLowerCase() &&
        GLOBALS.getGlucInfo().unit === Settings.msgUnitMMOL) {
        ret.glucose = ret.glucose / 18.02;
      } else if (json.units.toLowerCase() === Settings.msgUnitMMOL.toLowerCase() &&
        GLOBALS.getGlucInfo().unit === Settings.msgUnitMGDL) {
        ret.glucose = ret.glucose * 18.02;
      }
    }

    // Specialhandling for strange datamanagement of Uploader for Minimed 600-series
    if (json.key600 != null) {
      Log.todo('Auswertung von key600 für MiniMed in TreatmentData muss noch korrekt implementiert werden!');
      ret._from = Uploader.Minimed600;
      ret._key600 = JsonData.toText(json.key600);
      // const reg = RegExp(/microbolus (.*)U/);
      // Der folgende Code muss noch aktiviert und korrekt implementiert werden
      // const m = reg.exec(ret.notes)?.[0];
      // if (m != null && m.groupCount === 1) {
      //   if ((ret._absolute ?? 0) > 0) {
      //     ret.microbolus = ret._absolute / 3600 * ret.duration;
      //   } else {
      //     ret.microbolus = double.tryParse(m.group(1)) ?? 0.0;
      //   }
      // }
    }

    if (!ret.isSMB
      && (ret.eventType.toLowerCase() === 'correction bolus')
      && ret.enteredBy === 'loop://iPhone von Mika') {
      ret.isSMB = true;
    }

    if (!ret.isSMB
      && (ret.eventType.toLowerCase() === 'correction bolus')
      && json?.type?.toLowerCase() === 'smb') {
      ret.isSMB = true;
    }
    if (!ret.isSMB
      && ret.eventType.toLowerCase() === 'smb') {
      ret.isSMB = true;
    }

    ret.bwpGlucoseDifference = 0;
    if (ret.isBolusWizard) {
      try {
        const temp = JSON.parse(json.bolusCalculatorResult);
        if (ret._carbs === 0) {
          // ret._carbs = +temp.carbs;
        }
        ret.bwpGlucoseDifference = JsonData.toNumber(temp.glucoseDifference, 0);
        if (ret.bwpGlucoseDifference != 0) {
          //ret.bwpGlucoseDifference--;
        }
        // ignore: empty_catches
      } catch (ex) {
      }
    }
    return ret;
  }

  adjustedValue(v: number): number {
    if (this._percent != null) {
      return v + (v * this._percent) / 100.0;
    }
    if (this._rate != null) {
      return this._rate;
    }
    return v;
  }

  equals(t: TreatmentData): boolean {
    return this.createdAt.getTime() === t.createdAt.getTime() &&
      this.eventType === t.eventType &&
      this.duration === t.duration &&
      this.isSMB === t.isSMB &&
      this.notes === t.notes;
  }

  slice(src: TreatmentData, dst: TreatmentData, f: number): void {
    this._carbs = GlobalsData.calc(src._carbs, dst._carbs, f);
    this.glucose = GlobalsData.calc(src.glucose, dst.glucose, f);
    if (this.boluscalc != null) {
      this.boluscalc.slice(src.boluscalc, dst.boluscalc, f);
    }
  }

  calcIOB(profile: ProfileGlucData, time: Date): CalcIOBData {
    let dia = 3.0;
    let sens = 0.0;
    const check = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();

    if (profile != null) {
      dia = profile.store?.dia ?? dia;
      const temp = Utils.findLast(profile.store?.listSens, (e) => e.timeForCalc <= check);
      if (temp != null) {
        sens = temp.value;
      }
      // sens = profile.store?.listSens?.findLast((e: ProfileEntryData) => e.timeForCalc <= check)?.value ?? sens;
    }

    const scaleFactor = 3.0 / dia;
    const peak = 75.0;
    const ret = new CalcIOBData(0.0, 0.0, this);

    if (this.insulin != null) {
      const bolusTime = this.createdAt.getTime();
      const minAgo = scaleFactor * (time.getTime() - bolusTime) / 1000 / 60;

      if (minAgo < peak) {
        const x1 = minAgo / 5 + 1;
        ret.iob = this.insulin * (1 - 0.001852 * x1 * x1 + 0.001852 * x1);
        // units: BG (mg/dl)  = (BG/U) *    U insulin     * scalar
        ret.activity = sens * this.insulin * (2 / dia / 60 / peak) * minAgo;
      } else if (minAgo < 180) {
        const x2 = (minAgo - peak) / 5;
        ret.iob = this.insulin * (0.001323 * x2 * x2 - 0.054233 * x2 + 0.55556);
        ret.activity = sens * this.insulin * (2 / dia / 60 - (minAgo - peak) * 2 / dia / 60 / (60 * 3 - peak));
      }
    }

    return ret;
  }

  calcCOB(profile: ProfileGlucData, time: Date, lastDecayedBy: number): any {
    let delay = 20;
    let isDecaying = false;
    let initialCarbs;

    if (this.carbs != null) {
      const carbTime = this.createdAt;

      let carbs_hr = profile.store.carbRatioPerHour;
      if (carbs_hr === 0) {
        carbs_hr = 12;
      }
      const carbs_min = carbs_hr / 60;

      let decayedBy = carbTime;
      const minutesleft = Math.floor((lastDecayedBy - carbTime.getTime()) / 1000 / 60);
      decayedBy = Utils.addTimeMinutes(decayedBy, Math.floor(Math.max(delay, minutesleft) + this.carbs / carbs_min));
      if (delay > minutesleft) {
        initialCarbs = this.carbs;
      } else {
        initialCarbs = this.carbs + minutesleft * carbs_min;
      }
      const startDecay = Utils.addTimeMinutes(carbTime, delay);
      // noinspection RedundantIfStatementJS
      if (time.getTime() < lastDecayedBy ||
        time.getTime() > startDecay.getTime()) {
        isDecaying = true;
      } else {
        isDecaying = false;
      }

      return {initialCarbs: initialCarbs, decayedBy: decayedBy, isDecaying: isDecaying, carbTime: carbTime};
    }
    return null;
  }

  calcTotalCOB(data: ReportData,
               yesterday: DayData,
               ret: { totalCOB: number, isDecaying: boolean, lastDecayedBy: Date },
               profile: ProfileGlucData,
               time: Date,
               iob: (data: ReportData, time: Date, yesterday: DayData) => CalcIOBData): void {
    // TODO: figure out the liverSensRatio that gives the most accurate purple line predictions
    let liverSensRatio = 8.0;
    let sens = Utils.findLast(profile.store.listSens, (e) => e.timeForCalc <= this.timeForCalc)?.value ?? 0.0;
    let carbRatio = Utils.findLast(profile.store.listCarbratio, (e) => e.timeForCalc <= this.timeForCalc)?.value ?? 0.0;
    const cCalc = this.calcCOB(profile, time, ret.lastDecayedBy?.getTime() ?? 0);
    if (cCalc != null) {
      let decaysin_hr = (cCalc.decayedBy.getTime() - time.getTime()) / 1000 / 60 / 60;
      if (decaysin_hr > -10) {
        // units: BG
        const actStart = iob(data, ret.lastDecayedBy, yesterday).activity;
        // noinspection UnnecessaryLocalVariableJS
        const actEnd = iob(data, cCalc.decayedBy, yesterday).activity;
        const avgActivity = (actStart + actEnd) / 2;
        // units:  g = BG * scalar / BG / U * g / U
        if (sens === 0.0) {
          sens = 1.0;
        }
        if (carbRatio === 0.0) {
          carbRatio = 1.0;
        }
        const delayedCarbs = (avgActivity * liverSensRatio / sens) * carbRatio;
        const delayMinutes = Math.floor(delayedCarbs / profile.store.carbRatioPerHour * 60);
        if (delayMinutes > 0) {
          cCalc.decayedBy = Utils.addTimeMinutes(cCalc.decayedBy, delayMinutes);
          decaysin_hr = (cCalc.decayedBy.getTime() - time.getTime()) / 1000 / 60 / 60;
        }
      }

      ret.lastDecayedBy = cCalc.decayedBy;
      if (decaysin_hr > 0) {
        //console.info('Adding ' + delayMinutes + ' minutes to decay of ' + treatment.carbs +
        // 'g bolus at ' + treatment.mills);
        ret.totalCOB += Math.min(this.carbs, decaysin_hr * profile.store.carbRatioPerHour);
        //console.log('cob:', Math.min(cCalc.initialCarbs,
        // decaysin_hr * profile.getCarbAbsorptionRate(treatment.mills)),
        // cCalc.initialCarbs,decaysin_hr,profile.getCarbAbsorptionRate(treatment.mills));
        ret.isDecaying = cCalc.isDecaying;
      }
    } else {
      ret.totalCOB = 0;
    }
  }
}
