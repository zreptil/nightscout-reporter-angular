import {JsonData} from '@/_model/json-data';
import {GlobalsData} from '@/_model/globals-data';

export class BoluscalcData extends JsonData {
  profile: string;
  notes: string;
  eventTime: Date;
  targetBGLow: number;
  targetBGHigh: number;
  isf: number;
  ic: number;
  iob: number;
  bolusIob: number;
  basalIob: number;
  bolusIobUsed: boolean;
  basalIobUsed: boolean;
  bg: number;
  insulinBg: number;
  insulinBgUsed: boolean;
  bgDiff: number;
  insulinCarbs: number;
  carbs: number;
  cob: number;
  cobUsed: boolean;
  insulinCob: number;
  otherCorrection: number;
  insulinSuperBolus: number;
  insulinTrend: number;
  insulin: number;
  superBolusUsed: boolean;
  trendUsed: boolean;
  trend: string;
  ttUsed: boolean;
  NSClientId: string;

  constructor() {
    super();
  }

  get copy(): BoluscalcData {
    const ret = new BoluscalcData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): BoluscalcData {
    // ignore: omit_local_variable_types
    const ret = new BoluscalcData();
    if (json == null) {
      return ret;
    }
    ret.profile = json.profile;
    ret.notes = json.notes;
    ret.eventTime = JsonData.toDate(json.eventTime);
    ret.targetBGLow = JsonData.toNumber(json.targetBGLow);
    ret.targetBGHigh = JsonData.toNumber(json.targetBGHigh);
    ret.isf = JsonData.toNumber(json.isf);
    ret.ic = JsonData.toNumber(json.ic);
    ret.iob = JsonData.toNumber(json.iob);
    ret.bolusIob = JsonData.toNumber(json.bolusIob);
    ret.basalIob = JsonData.toNumber(json.basalIob);
    ret.bolusIobUsed = JsonData.toBool(json.bolusIobUsed);
    ret.basalIobUsed = JsonData.toBool(json.basalIobUsed);
    ret.bg = JsonData.toNumber(json.bg);
    ret.insulinBg = JsonData.toNumber(json.insulinBg);
    ret.insulinBgUsed = JsonData.toBool(json.insulinBgUsed);
    ret.bgDiff = JsonData.toNumber(json.bgdiff);
    ret.insulinCarbs = JsonData.toNumber(json.insulincarbs);
    ret.carbs = JsonData.toNumber(json.carbs);
    ret.cob = JsonData.toNumber(json.cob);
    ret.cobUsed = JsonData.toBool(json.cobused);
    ret.insulinCob = JsonData.toNumber(json.insulincob);
    ret.otherCorrection = JsonData.toNumber(json.othercorrection);
    ret.insulinSuperBolus = JsonData.toNumber(json.insulinsuperbolus);
    ret.insulinTrend = JsonData.toNumber(json.insulintrend);
    ret.insulin = JsonData.toNumber(json.insulin);
    if (ret.insulin == 0.0) {
      ret.insulin = JsonData.toNumber(json.enteredinsulin);
    }
    ret.superBolusUsed = JsonData.toBool(json.superbolusused);
    ret.trendUsed = JsonData.toBool(json.trendused);
    ret.trend = JsonData.toText(json.trend);
    ret.ttUsed = JsonData.toBool(json.ttused);
    ret.NSClientId = JsonData.toText(json.NSCLIENT_ID);
    return ret;
  }

  slice(src: BoluscalcData, dst: BoluscalcData, f: number): void {
    this.isf = Math.floor(GlobalsData.calc(src?.isf ?? 0, dst?.isf ?? 0, f));
    this.ic = Math.floor(GlobalsData.calc(src?.ic ?? 0, dst?.ic ?? 0, f));
    this.iob = Math.floor(GlobalsData.calc(src?.iob, dst?.iob, f));
    this.bolusIob = Math.floor(GlobalsData.calc(src?.bolusIob, dst?.bolusIob, f));
    this.basalIob = Math.floor(GlobalsData.calc(src?.basalIob, dst?.basalIob, f));
    this.bg = Math.floor(GlobalsData.calc(src?.bg ?? 0, dst?.bg ?? 0, f));
    this.insulinBg = Math.floor(GlobalsData.calc(src?.insulinBg, dst?.insulinBg, f));
    this.bgDiff = Math.floor(GlobalsData.calc(src?.bgDiff ?? 0, dst?.bgDiff ?? 0, f));
    this.insulinCarbs = Math.floor(GlobalsData.calc(src?.insulinCarbs, dst?.insulinCarbs, f));
    this.carbs = Math.floor(GlobalsData.calc(src?.carbs, dst?.carbs, f));
    this.cob = Math.floor(GlobalsData.calc(src?.cob, dst?.cob, f));
    this.insulinCob = Math.floor(GlobalsData.calc(src?.insulinCob, dst?.insulinCob, f));
    this.otherCorrection = Math.floor(GlobalsData.calc(src?.otherCorrection, dst?.otherCorrection, f));
    this.insulinSuperBolus = Math.floor(GlobalsData.calc(src?.insulinSuperBolus, dst?.insulinSuperBolus, f));
    this.insulinTrend = Math.floor(GlobalsData.calc(src?.insulinTrend, dst?.insulinTrend, f));
    this.insulin = Math.floor(GlobalsData.calc(src?.insulin, dst?.insulin, f));
  }
}
