import * as moment from 'moment';
import {Log} from '@/_services/log.service';

export class ProfileTimezone {
  location: moment.Locale;
  localDiff: number = 0;

  // noinspection JSUnusedLocalSymbols
  constructor(public name: string, isInitializing = false) {
    this.location = moment.defineLocale(name, null);
    if (location != null) {
      Log.todo('Die Locale muss noch korrekt implementiert werden!');
      // const d = moment('0000-01-01T00:00:00Z');
      this.localDiff = 0; // d.diff(new Date(0), 'hour') + JsonData.hourDiff;
    }
  }
}
