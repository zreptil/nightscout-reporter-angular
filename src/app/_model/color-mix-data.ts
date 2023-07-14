import {ColorData} from '@/_model/color-data';
import {BaseData} from '@/_model/base-data';

export class ColorMix extends BaseData {
  tl: ColorData;
  tr: ColorData;
  bl: ColorData;
  br: ColorData;

  constructor() {
    super();
    this._fillFromJson({});
  }

  get asJson(): any {
    return {
      tl: this.tl?.asJson,
      tr: this.tr?.asJson,
      bl: this.bl?.asJson,
      br: this.br?.asJson
    };
  }

  static fromJson(json: any): ColorMix {
    const ret = new ColorMix();
    ret.fillFromJson(json);
    return ret;
  }

  _fillFromJson(json: any): void {
    this.tl = ColorData.fromJson(json?.['colmix']?.['tl'], new ColorData([255, 0, 0]));
    this.tr = ColorData.fromJson(json?.['colmix']?.['tr'], new ColorData([0, 255, 0]));
    this.bl = ColorData.fromJson(json?.['colmix']?.['bl'], new ColorData([255, 0, 255]));
    this.br = ColorData.fromJson(json?.['colmix']?.['br'], new ColorData([0, 0, 255]));
  }
}

