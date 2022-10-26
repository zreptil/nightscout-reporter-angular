import {JsonData} from '../json-data';
import {LoopData} from '@/_model/nightscout/loop-data';
import {XDripJSData} from '@/_model/nightscout/xdrip-js-data';
import {UploaderData} from '@/_model/nightscout/uploader-data';
import {PumpData} from '@/_model/nightscout/pump-data';

export class DeviceStatusData extends JsonData {
  device: string;
  createdAt: Date;
  openAPS: LoopData;
  loop: LoopData;
  pump: PumpData;
  uploader: UploaderData;
  xdripjs: XDripJSData;

  constructor() {
    super();
  }

  static fromJson(json: any): DeviceStatusData {
    const ret = new DeviceStatusData();
    if (json == null) {
      return ret;
    }
    ret.device = JsonData.toText(json['device']);
    ret.createdAt = JsonData.toDate(json['created_at']);
    ret.openAPS = LoopData.fromJson(JsonData.ensureJson(json['openaps']));
    ret.loop = LoopData.fromJson(JsonData.ensureJson(json['loop']));
    ret.pump = PumpData.fromJson(JsonData.ensureJson(json['pump']));
    ret.uploader = UploaderData.fromJson(JsonData.ensureJson(json['uploader']));
    ret.xdripjs = XDripJSData.fromJson(JsonData.ensureJson(json['xdripjs']));
    return ret;
  }
}
