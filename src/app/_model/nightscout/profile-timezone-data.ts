import * as moment from 'moment';
import {JsonData} from '@/_model/json-data';

export class ProfileTimezone {
  location: moment.Locale;
  localDiff: number = 0;

  constructor(public name: string, isInitializing = false) {
    this.location = moment.defineLocale(name, null);
    if (location != null) {
      var d = moment('0000-01-01T00:00:00Z');
      this.localDiff = d
        .diff(new Date(0), 'hour') + JsonData.hourDiff;
    }
  }
}
