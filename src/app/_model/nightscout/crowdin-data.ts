import {GLOBALS} from '@/_model/globals-data';

export class CrowdinData {
  public langCode: string;
  public langName: string;
  public badgeCode: string;

  constructor(public project: string,
              public fileId: number,
              public langSrc: string,
              public statsCode: string) {
  }

  get projectUrl(): string {
    return `https://crowdin.com/project/${this.project}`;
  }

  get languageUrl(): string {
    return `https://crowdin.com/translate/${this.project}/${this.fileId}/${this.langSrc}-${this.langCode}`;
  }

  get badgeUrl(): string {
    return `https://badges.crowdin.net/${this.project}/localized.svg`;
  }

// <img alt="fr proofreading" src="https://img.shields.io/badge/dynamic/json?color=green&
// label=fr&
// style=flat&logo=crowdin&
// query=%24.progress[?(@.data.languageId==%27fr%27)].data.approvalProgress&
// url=https%3A%2F%2Fbadges.awesome-crowdin.com%2Fstats-13600041-555863.json" ></crowdin-copy-button>

  get languageBadgeUrl(): string {
    return 'https://img.shields.io/badge/dynamic/json?color='
      + (GLOBALS.isLocal ? 'blue' : 'rgb(0,128,0)')
      + `&label=${this.langName}`
      + `&style=flat&logo=crowdin&query=%24.progress[?(@.data.languageId==%27${this.badgeCode}%27)].data.`
      + (GLOBALS.isLocal ? 'approvalProgress' : 'translationProgress')
      + `&url=https%3A%2F%2Fbadges.awesome-crowdin.com%2Fstats-${this.statsCode}.json`;
  }

  static factoryGerman(): CrowdinData {
    return new CrowdinData('nightrep', 37, 'de', '13600041-555611');
  }

  static factoryEnglish(): CrowdinData {
    return new CrowdinData('nightrep-english', 39, 'en', '13600041-555863');
  }
}
