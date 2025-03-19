import {JsonData} from '@/_model/json-data';
import {Log} from '@/_services/log.service';

export class OAuth2Data {
  key: string;
  accessToken: string;
  refreshToken: string;
  userId: string;
  scope: string;

  get asJson(): any {
    // if certain values are not set, then return null
    if (this.key == null || this.refreshToken == null || this.userId == null) {
      return null;
    }
    return {
      a: this.key,
      b: this.accessToken,
      c: this.refreshToken,
      d: this.userId,
      e: this.scope
    };
  }

  static fromJson(json: any): OAuth2Data {
    const ret = new OAuth2Data();
    try {
      ret.key = JsonData.toText(json.a);
      ret.accessToken = JsonData.toText(json.b);
      ret.refreshToken = JsonData.toText(json.c);
      ret.userId = JsonData.toText(json.d);
      ret.scope = JsonData.toText(json.e);
    } catch (ex) {
      Log.devError(ex, `Fehler bei OAuth2Data.fromJson`);
    }
    return ret;
  }
}
