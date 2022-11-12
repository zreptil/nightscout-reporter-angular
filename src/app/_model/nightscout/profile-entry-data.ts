//*
import {JsonData, Uploader} from '@/_model/json-data';
import {ProfileTimezone} from '@/_model/nightscout/profile-timezone-data';
import {TreatmentData} from '@/_model/nightscout/treatment-data';

export class ProfileEntryData extends JsonData {
  _time: Date;
  forceText: string;
  value: number;
  duration: number = 3600; // duration in seconds
  orgValue: number;
  timeAsSeconds: number;
  _timezone: ProfileTimezone;
  from: Uploader = Uploader.Unknown;

  constructor(timezone: ProfileTimezone = null, src: Date = null) {
    super();
    if (timezone != null) {
      this._timezone = timezone;
    }
    this._time = src ?? new Date(0, 1, 1);
  }

  _percentAdjust: number;

  set percentAdjust(value: number) {
    this._percentAdjust = value;
  }

  _absoluteRate: number;

  set absoluteRate(value: number) {
    this._absoluteRate = value;
  }

  get tempAdjusted(): number {
    return this._absoluteRate != null ? 0 : (this.orgValue == null || this.orgValue === 0 ? 0 : (this.value - this.orgValue) / this.orgValue);
  }

  get localDiff(): number {
    return this._timezone.localDiff;
  }

  get hash(): string {
    return `${this._time.getHours()}:${this._time.getMinutes()}=${this.value}`;
  }

  get timeForCalc(): number {
    return this._time.getHours() * 3600 + this._time.getMinutes() * 60 + this._time.getSeconds();
  }

  set timeForCalc(value) {
    const h = Math.floor(value / 3600);
    const m = Math.floor((value % 3600) / 60);
    const s = value % 60;
    this._time = new Date(this._time.getFullYear(), this._time.getMonth(), this._time.getDate(), h, m, s);
  }

  get copy(): ProfileEntryData {
    const ret = new ProfileEntryData();
    ret.fillFrom(this);
    /*
        ret.value = this.value;
        ret.duration = this.duration;
        ret.timeAsSeconds = this.timeAsSeconds;
        ret._absoluteRate = this._absoluteRate;
        ret._timezone = this._timezone;
        ret._percentAdjust = this._percentAdjust;
        ret._time = this._time;
        ret.forceText = this.forceText;
        ret.orgValue = this.orgValue;
        ret._timezone = this._timezone;
        ret.from = this.from;
    */
    return ret;
  }

  get isCalculated(): boolean {
    return this._percentAdjust != null || this._absoluteRate != null;
  }

  static fromTreatment(timezone: ProfileTimezone, src: TreatmentData): ProfileEntryData {
    const ret = new ProfileEntryData(timezone, src.createdAt);
    if (src._percent != null) {
      ret.percentAdjust = src._percent;
    } else if (src._rate != null) {
      ret.absoluteRate = src._rate;
    }

    ret.from = src.from;
    if ((src.from === Uploader.Minimed600 ||
        src.from === Uploader.Tidepool ||
        src.from === Uploader.Spike ||
        src.from === Uploader.Unknown) &&
      src._absolute != null) {
      ret.absoluteRate = src._absolute;
    }
    ret.duration = src.duration;

    return ret;
  }

  static fromJson(json: any, timezone: ProfileTimezone, timeshift: number,
                  percentage = 1.0, isReciprocal = false): ProfileEntryData {
    const ret = new ProfileEntryData(timezone);
    if (json == null) {
      return ret;
    }
    ret._time = JsonData.toTime(json.time);
    if (ret._time.getHours() < 24 - timeshift) {
      ret._time.setHours(ret._time.getHours() + timeshift);
    } else {
      ret._time.setHours(ret._time.getHours() + timeshift - 24);
    }
    ret.value = JsonData.toNumber(json.value, null);
    if (ret.value != null) {
      if (isReciprocal) {
        if (percentage > 0) {
          ret.value /= percentage;
        } else {
          ret.value = 0;
        }
      } else {
        ret.value *= percentage;
      }
    }
    ret.timeAsSeconds = JsonData.toNumber(json.timeAsSeconds);
    return ret;
  }

  endTime(date: Date, adjustLocalForTime = false): Date {
    const ret = this.time(date, adjustLocalForTime);
    ret.setSeconds(ret.getSeconds() + this.duration - 1);
    return ret;
  }

  time(date: Date, adjustLocalForTime = false): Date {
    let hour = this._time.getHours();
    if (adjustLocalForTime) {
      hour += this._timezone.localDiff;
    }
    hour = hour % 24;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, this._time.getMinutes(), this._time.getSeconds());
  }

  clone(time: Date): ProfileEntryData {
    const ret = this.copy;
    ret._time = time;
    return ret;
  }

  transferCalcValues(src: ProfileEntryData): void {
    this._percentAdjust = src._percentAdjust;
    this._absoluteRate = src._absoluteRate;
  }

  adjustedValue(v: number): number {
    if (this._percentAdjust != null) {
      return v + (v * this._percentAdjust) / 100.0;
    }
    if (this._absoluteRate != null) {
      // spike needs a special handling, since the value seems to be the amount
      // given over the duration, not the amount given in one hour.
//      if (from === Uploader.Spike) return _absoluteRate / (duration / 3600);
      return this._absoluteRate;
    }
    return v;
  }
}
