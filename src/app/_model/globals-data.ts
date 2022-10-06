import {UserData} from '@/_model/user-data';
import {Utils} from '@/classes/utils';

export class GlobalsData {
  static _globals: GlobalsData = new GlobalsData();
  /// ***********************************************
  /// Zentraler Faktor für die Kalibrierung
  /// der Werte anhand eines vom Laber ermittelten
  /// HbA1C im Vergleich zu einem im gleichen
  /// 3 Monatszeitraum berechneten HbA1C
  /// ***********************************************
  static adjustFactor: number = 1.0;
  _userIdx: number = 0;
  userList: UserData[] = [];

  constructor() {
    // tz.Location found;
    //
    // var dt = new Date();
    // var offset = dt.getTimezoneOffset();
    // var list = tz.timeZoneDatabase.locations.values;
    // for (var l in list) {
    //   if (l.currentTimeZone.offset == offset) {
    //     found = l;
    //     break;
    //   }
    // }
    // if (found != null) {
    //   Globals.refTimezone = found.name;
    //   Globals.refLocation = found;
    // }
  }

  static get user(): UserData {
    if (GlobalsData._globals._userIdx >= 0 && GlobalsData._globals._userIdx < GlobalsData._globals.userList.length) return GlobalsData._globals.userList[GlobalsData._globals._userIdx];
    GlobalsData._globals._userIdx = 0;
    if (Utils.isEmpty(GlobalsData._globals.userList)) GlobalsData._globals.userList.push(new UserData(GlobalsData._globals));
    return GlobalsData._globals.userList[0];
  }
}
