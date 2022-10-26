import {ThresholdData} from './nightscout/threshold-data';
import {JsonData} from '@/_model/json-data';
import {GlobalsData} from '@/_model/globals-data';

export class SettingsData extends JsonData {
  units: string;
  timeFormat: number;
  nightMode: boolean;
  editMode: boolean;
  showRawbg: string;
  customTitle: string;
  theme: string;
  alarmUrgentHigh: boolean;
  alarmUrgentHighMins: number[] = [];
  alarmHigh: boolean;
  alarmHighMins: number[] = [];
  alarmLow: boolean;
  alarmLowMins: number[] = [];
  alarmUrgentLow: boolean;
  alarmUrgentLowMins: number[] = [];
  alarmUrgentMins: number[] = [];
  alarmWarnMins: number[] = [];
  alarmTimeagoWarn: boolean;
  alarmTimeagoWarnMins: number;
  alarmTimeagoUrgent: boolean;
  alarmTimeagoUrgentMins: number;
  language: string;
  scaleY: string;
  showPlugins: string[] = [];
  showForecast: string;
  focusHours: number;
  heartbeat: number;
  baseURL: string;
  authDefaultRoles: string;
  thresholds: ThresholdData;
  defaultFeatures: string[] = [];
  alarmTypes: string[] = [];
  enable: string[] = [];

  constructor() {
    super();
  }

  get bgTargetTop(): number {
    if (this.thresholds == null) {
      return null;
    }
    const factor = GlobalsData.user.adjustTarget ? GlobalsData.user.hba1cAdjustFactor : 1.0;
    return Math.floor(factor * this.thresholds.bgTargetTop);
  }

  get bgTargetBottom(): number {
    if (this.thresholds == null) {
      return null;
    }
    const factor = GlobalsData.user.adjustTarget ? GlobalsData.user.hba1cAdjustFactor : 1.0;
    return Math.floor(factor * this.thresholds.bgTargetBottom);
  }

  static fromJson(json: any): SettingsData {
    const ret = new SettingsData();
    if (json == null) {
      return ret;
    }
    ret.units = JsonData.toText(json['units']);
    ret.timeFormat = JsonData.toNumber(json['timeFormat']);
    ret.nightMode = JsonData.toBool(json['nightMode']);
    ret.editMode = JsonData.toBool(json['editMode']);
    ret.showRawbg = JsonData.toText(json['showRawbg']);
    ret.customTitle = JsonData.toText(json['customTitle']);
    ret.theme = JsonData.toText(json['theme']);
    ret.alarmUrgentHigh = JsonData.toBool(json['alarmUrgentHigh']);
    for (const entry of json['alarmUrgentHighMins']) {
      ret.alarmUrgentHighMins.push(JsonData.toNumber(entry));
    }
    ret.alarmHigh = JsonData.toBool(json['alarmHigh']);
    for (const entry of json['alarmHighMins']) {
      ret.alarmHighMins.push(JsonData.toNumber(entry));
    }
    ret.alarmLow = JsonData.toBool(json['alarmLow']);
    for (const entry of json['alarmLowMins']) {
      ret.alarmLowMins.push(JsonData.toNumber(entry));
    }
    ret.alarmUrgentLow = JsonData.toBool(json['alarmUrgentLow']);
    for (const entry of json['alarmUrgentLowMins']) {
      ret.alarmUrgentLowMins.push(JsonData.toNumber(entry));
    }
    for (const entry of json['alarmUrgentMins']) {
      ret.alarmUrgentMins.push(JsonData.toNumber(entry));
    }
    for (const entry of json['alarmWarnMins']) {
      ret.alarmWarnMins.push(JsonData.toNumber(entry));
    }
    ret.alarmTimeagoWarn = JsonData.toBool(json['alarmTimeagoWarn']);
    ret.alarmTimeagoWarnMins = JsonData.toNumber(json['alarmTimeagoWarnMins']);
    ret.alarmTimeagoUrgent = JsonData.toBool(json['alarmTimeagoUrgent']);
    ret.alarmTimeagoUrgent = JsonData.toBool(json['alarmTimeagoUrgent']);
    ret.alarmTimeagoUrgentMins = JsonData.toNumber(json['alarmTimeagoUrgentMins']);
    ret.language = json['language'];
    ret.scaleY = json['scaleY'];
    for (const entry in json['showPlugins'].toString().split(' ')) {
      if (entry != '') {
        ret.showPlugins.push(entry);
      }
    }
    ret.showForecast = json['showForecast'];
    ret.focusHours = JsonData.toNumber(json['focusHours']);
    ret.heartbeat = JsonData.toNumber(json['heartbeat']);
    ret.baseURL = json['baseURL'];
    ret.authDefaultRoles = json['authDefaultRoles'];
    if (json['thresholds'] != null) {
      ret.thresholds = ThresholdData.fromJson(json['thresholds']);
    }
    for (const entry of json['DEFAULT_FEATURES']) {
      ret.defaultFeatures.push(entry);
    }
    for (const entry of json['alarmTypes']) {
      ret.alarmTypes.push(entry);
    }
    for (const entry of json['enable']) {
      ret.enable.push(entry);
    }
    return ret;
  }
}
