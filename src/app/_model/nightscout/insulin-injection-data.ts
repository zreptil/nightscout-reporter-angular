import {JsonData} from '@/_model/json-data';

export class InsulinInjectionData extends JsonData {
  insulin: string;
  units: number;

  constructor() {
    super();
  }

  get copy(): InsulinInjectionData {
    const ret = new InsulinInjectionData();
    ret.fillFrom(this);
    return ret;
  }

  static fromJson(json: any): InsulinInjectionData {
    const ret = new InsulinInjectionData();
    if (json == null) {
      return ret;
    }
    ret.insulin = JsonData.toText(json.insulin);
    ret.units = JsonData.toNumber(json.units);
    return ret;
  }
}
