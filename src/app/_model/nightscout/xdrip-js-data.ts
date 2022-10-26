import {JsonData} from '@/_model/json-data';

export class XDripJSData extends JsonData {
  state: number;
  stateString: string;
  stateStringShort: string;
  txId: string;
  txStatus: number;
  txStatusString: string;
  txStatusStringShort: string;
  txActivation: Date;
  mode: string;
  timestamp: Date;
  rssi: number;
  unfiltered: number;
  filtered: number;
  noise: number;
  noiseString: number;
  slope: number;
  intercept: number;
  calType: string;
  lastCalibrationDate: Date;
  sessionStart: Date;
  batteryTimestamp: Date;
  voltageA: number;
  voltageB: number;
  temperature: number;
  resistance: number;

  constructor() {
    super();
  }

  get copy(): XDripJSData {
    const ret = new XDripJSData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): XDripJSData {
    const ret = new XDripJSData();
    if (json == null) {
      return ret;
    }
    ret.state = JsonData.toNumber(json['state']);
    ret.stateString = JsonData.toText(json['stateString']);
    ret.stateStringShort = JsonData.toText(json['stateStringShort']);
    ret.txId = JsonData.toText(json['txId']);
    ret.txStatus = JsonData.toNumber(json['txStatus']);
    ret.txStatusString = JsonData.toText(json['txStatusString']);
    ret.txStatusStringShort = JsonData.toText(json['txStatusStringShort']);
    ret.txActivation = JsonData.toDate(json['txActivation']);
    ret.mode = JsonData.toText(json['mode']);
    ret.timestamp = JsonData.toDate(json['timestamp']);
    ret.rssi = JsonData.toNumber(json['rssi']);
    ret.unfiltered = JsonData.toNumber(json['unfiltered']);
    ret.filtered = JsonData.toNumber(json['filtered']);
    ret.noise = JsonData.toNumber(json['noise']);
    ret.noiseString = JsonData.toNumber(json['noiseString']);
    ret.slope = JsonData.toNumber(json['slope']);
    ret.intercept = JsonData.toNumber(json['intercept']);
    ret.calType = JsonData.toText(json['calType']);
    ret.lastCalibrationDate = JsonData.toDate(json['lastCalibrationDate']);
    ret.sessionStart = JsonData.toDate(json['sessionStart']);
    ret.batteryTimestamp = JsonData.toDate(json['batteryTimestamp']);
    ret.voltageA = JsonData.toNumber(json['voltagea']);
    ret.voltageB = JsonData.toNumber(json['voltageb']);
    ret.temperature = JsonData.toNumber(json['temperature']);
    ret.resistance = JsonData.toNumber(json['resistance']);
    return ret;
  }
}
