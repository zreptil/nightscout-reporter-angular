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
  min: number;
  max: number;
  list: string[];
  subParams: ParamInfo[];
  thumbValue: any;
  stateForAll: boolean;

  constructor(public sort: number,
              public title: string,
              args: {
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
                thumbValue?: any,
                stateForAll?: boolean,
              }) {
    Utils.pushArgs(args, this);
    this.isDeprecated ??= false;
    this.isLoopValue ??= false;
//  _boolValue = boolValue;
//  _intValue = intValue;
//  _stringValue = stringValue;
//  _literalFormat = literalFormat;
    if (this.boolValue != null) {
      this.type = ParamType.bool;
      this.thumbValue ??= this.boolValue;
    }
    if (this.stringValue != null) {
      this.type = ParamType.string;
      this.thumbValue ??= this.stringValue;
    }
    if (this.intValue != null) {
      this.type = ParamType.int;
      this.thumbValue ??= this.intValue;
    }
    if (this.list != null) {
      this.type = ParamType.list;
      this.thumbValue ??= 0;
    }
    if (this.literalFormat != null) {
      this.type = ParamType.literal;
      this.thumbValue ??= 0;
    }
  }

  _boolValue: boolean;

  get boolValue(): boolean {
    return this.isForThumbs ? this.thumbValue : (this.isLoopValue && GLOBALS.hideLoopData ? false : this._boolValue);
  }

  set boolValue(value) {
    this._boolValue = value;
    this.handleValueChange(value);
  }

  _stringValue: string;

  get stringValue(): string {
    return this.isForThumbs ? this.thumbValue : this._stringValue;
  }

  set stringValue(value) {
    this._stringValue = value;
    this.handleValueChange(value);
  }

  _intValue: number;

  get intValue(): number {
    return this.isForThumbs ? this.thumbValue : this._intValue;
  }

  set intValue(value) {
    this._intValue = value;
    this.handleValueChange(value);
  }

  _literalFormat: LiteralFormat;

  get literalFormat(): LiteralFormat {
    return this.isForThumbs ? this.thumbValue : this._literalFormat;
  }

  set literalFormat(value) {
    this._literalFormat = value;
  }

  get sliderValue(): number {
    return this.intValue >= this.min && this.intValue <= this.max ? this.intValue : this.min;
  }

  set sliderValue(value) {
    this.intValue = value;
    this.handleValueChange(value);
  }

  get listValue(): string {
    if (Utils.isEmpty(this.list)) {
      return '';
    }
    if (this.intValue == null || this.intValue < 0 || this.intValue >= this.list.length) {
      return this.list[0];
    }
    return this.list[this.intValue];
  }

  get asJson(): any {
    const sp = [];
    if (this.subParams != null) {
      for (const p of this.subParams) {
        if (p.type != ParamType.literal) {
          sp.push(p.asJson);
        }
      }
    }
    return {b: this.boolValue, s: this.stringValue, i: this.intValue, sp: sp};
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
    this.boolValue = src.boolValue;
    this.stringValue = src.stringValue;
    this.intValue = src.intValue;
    this.subParams = src.subParams;
    if (checkValue != null) {
      checkValue(this, null);
    }
    this.checkValue = checkValue;
  }

  fillFromJson(value: any, checkValue: (info: ParamInfo, value: any) => void): void {
    try {
      switch (this.type) {
        case ParamType.bool:
          this.boolValue = value['b'] ?? false;
          if (checkValue != null) {
            checkValue(this, this.boolValue);
          }
          break;
        case ParamType.string:
          this.stringValue = value['s'] ?? '';
          if (checkValue != null) {
            checkValue(this, this.stringValue);
          }
          break;
        case ParamType.int:
        case ParamType.list:
          this.intValue = value['i'] ?? 0;
          if (checkValue != null) {
            checkValue(this, this.intValue);
          }
          break;
        default:
          break;
      }
      if (this.subParams != null) {
        for (let i = 0; i < this.subParams.length; i++) {
          if (i < value['sp'].length) {
            this.subParams[i].fillFromJson(value['sp'][i], checkValue);
          }
        }
      }
    } catch (ex) {
    }
    this.checkValue = checkValue;
  }
}
