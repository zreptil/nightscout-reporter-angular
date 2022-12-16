export class CrowdinData {
  public langCode: string;
  public langName: string;
  public langIdx: number;

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

  get languageBadgeUrl(): string {
    return `https://img.shields.io/badge/dynamic/json?color=rgb(0,128,0)&label=${this.langName}`
      + `&style=plastic&logo=crowdin&query=%24.progress.${this.langIdx}.data.approvalProgress`
      + `&url=https%3A%2F%2Fbadges.awesome-crowdin.com%2Fstats-${this.statsCode}.json`;
  }

  static factoryGerman(): CrowdinData {
    return new CrowdinData('nightrep', 37, 'de', '13600041-555611');
  }

  static factoryEnglish(): CrowdinData {
    return new CrowdinData('nightrep-english', 39, 'en', '13600041-555863');
  }
}
