import {Utils} from '@/classes/utils';
import {GLOBALS} from '@/_model/globals-data';

export class LiteralFormat {
  constructor(public divider = true) {
  }
}

enum ParamType { none, bool, string, int, list, literal }

export class ParamInfo {
  type = ParamType.none;
  isForThumbs = false;
  checkValue: (info: ParamInfo, value: any) => void;
  isDeprecated: boolean;
  isLoopValue: boolean;
  isDisabled = false;
  isVisible = true;
  subtitle: string;

  constructor(public sort: number,
              public title: string,
              public options: {
                boolValue?: boolean,
                stringValue?: string,
                intValue?: number,
                literalFormat?: LiteralFormat,
                min?: number,
                max?: number,
                list?: string[],
                subParams?: ParamInfo[],
                isDeprecated?: boolean,
                isLoopValue?: boolean,
                thumbValue?: any
              }) {
    if (options.isDeprecated == null) {
      options.isDeprecated = false;
    }
    if (options.isLoopValue == null) {
      options.isLoopValue = false;
    }
//  _boolValue = boolValue;
//  _intValue = intValue;
//  _stringValue = stringValue;
//  _literalFormat = literalFormat;
    if (options?.boolValue != null) {
      this.type = ParamType.bool;
      this.options.thumbValue ??= this.options.boolValue;
    }
    if (options?.stringValue != null) {
      this.type = ParamType.string;
      this.options.thumbValue ??= this.options.stringValue;
    }
    if (options?.intValue != null) {
      this.type = ParamType.int;
      this.options.thumbValue ??= this.options.intValue;
    }
    if (options.list != null) {
      this.type = ParamType.list;
      this.options.thumbValue ??= 0;
    }
    if (options?.literalFormat != null) {
      this.type = ParamType.literal;
      this.options.thumbValue ??= 0;
    }
  }

  get boolValue(): boolean {
    return this.isForThumbs ? this.options.thumbValue : (this.isLoopValue && GLOBALS.hideLoopData ? false : this.options.boolValue);
  }

  set boolValue(value) {
    this.options.boolValue = value;
    this.handleValueChange(value);
  }

  get stringValue(): string {
    return this.isForThumbs ? this.options.thumbValue : this.options.stringValue;
  }

  set stringValue(value) {
    this.options.stringValue = value;
    this.handleValueChange(value);
  }

  get intValue(): number {
    return this.isForThumbs ? this.options.thumbValue : this.options.intValue;
  }

  set intValue(value) {
    this.options.intValue = value;
    this.handleValueChange(value);
  }

  get literalFormat(): LiteralFormat {
    return this.isForThumbs ? this.options.thumbValue : this.options.literalFormat;
  }

  set literalFormat(value) {
    this.options.literalFormat = value;
  }

  get sliderValue(): number {
    return this.intValue >= this.options.min && this.intValue <= this.options.max ? this.intValue : this.options.min;
  }

  set sliderValue(value) {
    this.options.intValue = value;
    this.handleValueChange(value);
  }

  get listValue(): string {
    if (Utils.isEmpty(this.options.list)) {
      return '';
    }
    if (this.options.intValue == null || this.options.intValue < 0 || this.options.intValue >= this.options.list.length) {
      return this.options.list[0];
    }
    return this.options.list[this.options.intValue];
  }

  get asJson(): any {
    const sp = [];
    if (this.options.subParams != null) {
      for (const p of this.options.subParams) {
        if (p.type != ParamType.literal) {
          sp.push(p.asJson);
        }
      }
    }
    return {b: this.options.boolValue, s: this.options.stringValue, i: this.options.intValue, sp: sp};
  }

  handleValueChange(value: any): void {
    if (this.checkValue != null) {
      this.checkValue(this, value);
    }
  }

  fill(src: ParamInfo, checkValue: (info: ParamInfo, value: any) => void): void {
    if (src.type != ParamType.literal) {
      return;
    }
    this.options.boolValue = src.boolValue;
    this.options.stringValue = src.stringValue;
    this.options.intValue = src.intValue;
    this.options.subParams = src.options.subParams;
    if (checkValue != null) {
      checkValue(this, null);
    }
    this.checkValue = checkValue;
  }

  fillFromJson(value: any, checkValue: (info: ParamInfo, value: any) => void): void {
    try {
      switch (this.type) {
        case ParamType.bool:
          this.options.boolValue = value['b'] ?? false;
          if (checkValue != null) {
            checkValue(this, this.options.boolValue);
          }
          break;
        case ParamType.string:
          this.options.stringValue = value['s'] ?? '';
          if (checkValue != null) {
            checkValue(this, this.options.stringValue);
          }
          break;
        case ParamType.int:
        case ParamType.list:
          this.options.intValue = value['i'] ?? 0;
          if (checkValue != null) {
            checkValue(this, this.options.intValue);
          }
          break;
        default:
          break;
      }
      if (this.options.subParams != null) {
        for (let i = 0; i < this.options.subParams.length; i++) {
          if (i < value['sp'].length) {
            this.options.subParams[i].fillFromJson(value['sp'][i], checkValue);
          }
        }
      }
    } catch (ex) {
    }
    this.checkValue = checkValue;
  }
}
