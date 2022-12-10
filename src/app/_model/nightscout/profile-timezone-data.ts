import {Log} from '@/_services/log.service';

export class ProfileTimezone {
  localDiff: number = 0;

  // noinspection JSUnusedLocalSymbols
  constructor(public name: string, isInitializing = false) {
    Log.todo('Die Locale muss noch korrekt implementiert werden!');
    const date = new Date();
    this.localDiff = date.getTimezoneOffset() / 60; // d.diff(new Date(0), 'hour') + JsonData.hourDiff;
  }
}
