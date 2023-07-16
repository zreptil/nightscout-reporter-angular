import {CrowdinData} from '@/_model/nightscout/crowdin-data';

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

  get is24HourFormat(): boolean {
    switch (this.code) {
      case 'en-US':
      case 'en-GB':
        return false;
      default:
        return true;
    }
  }

  get dateformat(): string {
    return $localize`:this is the dateformat, please use dd for days, MM for months and yyyy for year. It has to be the english formatstring.:dd.MM.yyyy`;
  }

  get dateShortFormat(): string {
    return $localize`:this is the dateformat, please use dd for days, MM for months and no year. It has to be the english formatstring.:dd.MM.`;
  }

  get imgPath(): String {
    return `assets/img/lang-${this.img}.png`;
  }
}
