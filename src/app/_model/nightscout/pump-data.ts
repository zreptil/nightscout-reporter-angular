import {JsonData} from '@/_model/json-data';
import {PumpBatteryData} from '@/_model/nightscout/pump-battery-data';
import {PumpStatusData} from '@/_model/nightscout/pump-status-data';

export class PumpData extends JsonData {
  clock: Date;
  pumpBattery: PumpBatteryData;
  reservoir: number;
  pumpStatus: PumpStatusData;

  constructor() {
    super();
  }

  get copy(): PumpData {
    const ret = new PumpData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): PumpData {
    const ret = new PumpData();
    if (json == null) {
      return ret;
    }
    ret.clock = JsonData.toDate(json.clock);
    ret.pumpBattery = PumpBatteryData.fromJson(json.pumpbattery);
    ret.reservoir = JsonData.toNumber(json.reservoir);
    ret.pumpStatus = PumpStatusData.fromJson(json.pumpstatus);
    return ret;
  }
}
