import {ColorUtils} from '@/controls/color-picker/color-utils';
import {BaseData} from '@/_model/base-data';
import {JsonData} from '@/_model/json-data';
import {Utils} from '@/classes/utils';

export class ColorData extends BaseData {

  constructor(public value: number[]) {
    super();
    if (!Array.isArray(value)) {
      this.value = [255, 255, 255];
    }
  }

  get display(): string {
    return ColorUtils.display_rgb(this.value);
  }

  get fontDisplay(): string {
    return ColorUtils.getFontColor(this.value);
  }

  get asJson(): any {
    if ((this.value?.length ?? 0) < 3) {
      this.value = [255, 255, 255];
    }
    return {
      'v': Utils.pad(this.value[0]?.toString(16) ?? 0) +
        Utils.pad(this.value[1]?.toString(16) ?? 0) +
        Utils.pad(this.value[2]?.toString(16) ?? 0)
    };
  }

  static fromJson(json: any, def?: ColorData): ColorData {
    const ret = new ColorData(null);
    ret.fillFromJson(json, def);
    return ret;
  }

  equals(check: ColorData): boolean {
    return ColorUtils.rgb2value(check?.value) === ColorUtils.rgb2value(this.value);
  }

  similar(check: ColorData): boolean {
    for (let i = 0; i < 3; i++) {
      if (Math.abs(this.value[i] - check.value[i]) > 5) {
        return false;
      }
    }
    return true;
  }

  _fillFromJson(json: any, def: ColorData): void {
    const v = [0, 0, 0];
    const d = ColorUtils.rgb2string(def?.value ?? [0, 0, 0]);
    const src = JsonData.toString(json, 'v', d) ?? '';
    Utils.pad(src, 6);
    for (let i = 0; i < v.length; i++) {
      v[i] = parseInt(src.substring(i * 2, i * 2 + 2), 16);
    }
    this.value = v;
  }
}

