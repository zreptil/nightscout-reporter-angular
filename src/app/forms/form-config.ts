import {BasePrint} from '@/forms/base-print';

export class FormConfig {
  opened = false;

  constructor(public form: BasePrint, public _checked: boolean) {
  }

  get dataId(): string {
    return this.form.dataId;
  }

  get id(): string {
    return this.form.id;
  }

  get idx(): string {
    return this.form.idx;
  }

  get checked(): boolean {
    return this._checked;
  }

  set checked(value: boolean) {
    this._checked = value;
  }

  get asJson(): any {
    const ret: any = {c: this.checked, p: []};

    if (this.form.params != null) {
      for (const entry of this.form.params) {
        ret.p.push(entry.asJson);
      }
    }
    return ret;
  }

  get asString(): string {
    return JSON.stringify(this.asJson);
  }

  fill(src: FormConfig): void {
    for (let i = 0; i < src.form.params.length; i++) {
      if (i >= this.form.params.length) {
        this.form.params.push(src.form.params[i]);
      }
      this.form.params[i].fill(src.form.params[i], this.form.checkValue.bind(this.form));
    }
    this.form.extractParams();
  }

  fillFromJson(value: any): void {
    try {
      this.checked = value.c;
      for (let i = 0; i < value.p.length && i < this.form.params.length; i++) {
        this.form.params[i].fillFromJson(value['p'][i], this.form.checkValue.bind(this.form));
      }
      // ignore: empty_catches
    } catch (ex) {
    }
    this.form.extractParams();
  }

  fillFromString(value: any): void {
    if (value != null) {
      if (typeof value === 'string') {
        this.fillFromJson(JSON.parse(value));
      } else {
        this.fillFromJson(value);
      }
    }
  }
}
