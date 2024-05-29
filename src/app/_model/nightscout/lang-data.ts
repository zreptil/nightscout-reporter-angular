import {CrowdinData} from '@/_model/nightscout/crowdin-data';
import {GLOBALS} from '@/_model/globals-data';

export class LangData {

  constructor(public code: string, public name: string, public img: string, public crowdin: CrowdinData, badgeCode: string, langCode?: string) {
    if (crowdin != null) {
      crowdin.langName = name;
      crowdin.badgeCode = badgeCode;
      crowdin.langCode = langCode;
      if (langCode == null) {
        const parts = code.toLowerCase().split('-');
        if (parts[0] === parts[1]) {
          crowdin.langCode = parts[0];
        } else {
          crowdin.langCode = `${parts[0]}${parts[1]}`;
        }
      }
    }
  }

  get shortCode(): string {
    const parts = this.code?.split('-') ?? ['de'];
    return parts[0];
  }

  get is24HourFormat(): boolean {
    if (GLOBALS.pp24HourFormat !== null) {
      return GLOBALS.pp24HourFormat;
    }
    switch (this.code) {
      case 'en-US':
      case 'en-GB':
        return false;
      default:
        return true;
    }
  }

  get timeFormat(): string {
    return $localize`:this is the timeformat - please use hh for 24-hours, HH for 12-hours, ap for am/pm, mm for minutes, ss for seconds:hh:mm:ss Uhr`;
  }

  get timeShortFormat(): string {
    return $localize`:this is the short timeformat - please use hh for 24-hours, HH for 12-hours, ap for am/pm, mm for minutes:hh:mm Uhr`;
  }

  get dateFormat(): string {
    return $localize`:this is the dateformat, please use dd for days, MM for months and yyyy for year.:dd.MM.yyyy`;
  }

  get dateShortFormat(): string {
    return $localize`:this is the dateformat, please use dd for days, MM for months and no year.:dd.MM.`;
  }

  get imgPath(): String {
    return `assets/img/lang-${this.img}.png`;
  }
}
