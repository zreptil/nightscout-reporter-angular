import {JsonData} from '@/_model/json-data';
import {Log} from '@/_services/log.service';

export class OAuth2Data {
  key: string;
  accessToken: string;
  refreshToken: string;
  tokenExpires: number;
  userId: string;
  scope: string;

  get asJson(): any {
    return {
      a: this.key,
      b: this.accessToken,
      c: this.refreshToken,
      d: this.userId,
      e: this.scope,
      f: this.tokenExpires
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
      ret.tokenExpires = JsonData.toNumber(json.f);
    } catch (ex) {
      Log.devError(ex, `Fehler bei OAuth2Data.fromJson`);
    }
    return ret;
  }
}
