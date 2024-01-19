import {ColorUtils} from '@/controls/color-picker/color-utils';
import {BaseData} from '@/_model/base-data';
import {Utils} from '@/classes/utils';

export class ColorData extends BaseData {
  icon = 'palette';
  btnForeColor: string;
  btnBackColor: string;
  btnClass: string;
  themeKey: string;
  title: string;
  subtitle: string;
  isBackColor = true;
  type: 'standard' | 'rgb' = 'standard';

  constructor(public value: number[], public opacity = 1.0) {
    super();
    if (!Array.isArray(value)) {
      this.value = [255, 255, 255];
    }
  }

  get display(): string {
    if (this.type === 'rgb') {
      return `${this.value[0]},${this.value[1]},${this.value[2]}`;
    }
    return ColorUtils.display_rgba(this.value, this.opacity);
  }

  get css(): string {
    return ColorUtils.display_rgba(this.value, this.opacity);
  }

  get display_rgb(): string {
    return ColorUtils.rgb2string(this.value);
  }

  get display_rgba(): string {
    return ColorUtils.rgb2string([...this.value, Math.floor(this.opacity * 255)]);
  }

  get fontDisplay(): string {
    return ColorUtils.fontColor(this.value);
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

  static fromString(value: string): ColorData {
    const ret = new ColorData(null);
    const parts = value?.split(',');
    if (parts?.length === 3) {
      ret.value[0] = +parts[0];
      ret.value[1] = +parts[1];
      ret.value[2] = +parts[2];
    } else if (value?.length === 7) {
      const r = parseInt(value.substring(1, 3), 16);
      const g = parseInt(value.substring(3, 5), 16);
      const b = parseInt(value.substring(5), 16);
      ret.value = [r, g, b];
    } else if (value?.length === 4) {
      const r = parseInt(value.substring(1, 2), 16);
      const g = parseInt(value.substring(2, 3), 16);
      const b = parseInt(value.substring(3), 16);
      ret.value = [r * 16 + r, g * 16 + g, b * 16 + b];
    } else if (value?.length === 9) {
      const r = parseInt(value.substring(1, 3), 16);
      const g = parseInt(value.substring(3, 5), 16);
      const b = parseInt(value.substring(5, 7), 16);
      ret.value = [r, g, b];
      ret.opacity = parseInt(value.substring(7), 16) / 255;
    } else if (value?.startsWith('rgb(')) {
      const parts = value.substring(4, value.length - 1).split(',');
      ret.value = [+parts[0], +parts[1], +parts[2]];
    } else if (value?.startsWith('rgba(')) {
      const parts = value.substring(5, value.length - 1).split(',');
      ret.value = [+parts[0], +parts[1], +parts[2]];
      ret.opacity = +parts[3];
    }

    return ret;
  }

  static fromJson(json: any, def?: ColorData): ColorData {
    const ret = new ColorData(null);
    ret.fillFromJson(json, def);
    return ret;
  }

  update(value: number[], opacity = this.opacity) {
    this.value = value;
    this.opacity = opacity;
  }

  equals(check: ColorData): boolean {
    return check.display === this.display;
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
    const src = BaseData.toString(json, 'v', d) ?? '';
    Utils.pad(src, 6);
    for (let i = 0; i < v.length; i++) {
      v[i] = parseInt(src.substring(i * 2, i * 2 + 2), 16);
    }
    this.value = v;
  }
}

