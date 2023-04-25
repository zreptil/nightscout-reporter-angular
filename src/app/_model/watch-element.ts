import {Log} from '@/_services/log.service';

export class WatchElement {
  static maxSize = 6;
  type: string;
  selected = false;
  bold = false;
  italic = false;
  groupId?: string;

  constructor() {
  }

  _size: number;

  get size(): number {
    return this._size;
  }

  set size(value: number) {
    if (value == null || value < 1) {
      value = 1;
    }
    if (value > WatchElement.maxSize) {
      value = WatchElement.maxSize;
    }
    this._size = value;
  }

  _vertical = 1;

  get vertical(): number {
    return this._vertical;
  }

  set vertical(value: number) {
    if (value == null || value < 0) {
      value = 0;
    }
    if (value > 2) {
      value = 2;
    }
    this._vertical = value;
  }

// retrieve the data as a json-encoded-string
  get asJsonString(): string {
    return `{"t":"${this.type}"`
      + `,"s":${this.size}`
      + `,"b":${this.bold}`
      + `,"i":${this.italic}`
      + `,"v":${this.vertical}`
      + `,"g":"${this.groupId ?? ''}"`
      + '}';
  }

  static fromJson(json: any): WatchElement {
    const ret = new WatchElement();
    try {
      ret.type = json.t ?? 'nl';
      ret.size = json.s ?? 1;
      ret.bold = json.b ?? false;
      ret.italic = json.i ?? false;
      ret.selected = json.selected ?? false;
      ret.vertical = json.v ?? 1;
      ret.groupId = json.g ?? 'center';
      if (ret.groupId === '') {
        ret.groupId = 'center';
      }
    } catch (ex) {
      Log.devError(ex, `Fehler bei WatchElement.fromJson`);
    }
    return ret;
  }
}
