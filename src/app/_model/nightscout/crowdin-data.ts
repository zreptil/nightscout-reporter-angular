export class CrowdinData {
  public langCode: string;

  constructor(public project: string, public fileId: number, public langSrc: string) {
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

  static factoryGerman(): CrowdinData {
    return new CrowdinData('nightrep', 37, 'de');
  }

  static factoryEnglish(): CrowdinData {
    return new CrowdinData('nightrep-english', 39, 'en');
  }
}
