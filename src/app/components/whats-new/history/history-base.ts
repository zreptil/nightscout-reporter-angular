import {Component} from '@angular/core';
import {Utils} from '@/classes/utils';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-vbase',
  template: '',
  standalone: true
})
export abstract class HistoryBase {
  abstract data: number[];

  constructor(public sanitizer: DomSanitizer) {
  }

  get version() {
    let parts: string[] = [];
    for (const c of `${this.data?.[0] ?? ''}`) {
      parts.push(c);
    }
    const ret: string[] = [Utils.join(parts, '.')];
    ret.push(Utils.fmtDate(Utils.parseDate(`${this.data[1]}`)));
    return this.sanitizer.bypassSecurityTrustHtml(
      `<span i18n="version">Version</span><span>${Utils.join(ret, ' - ')}</span>`
    );
  }
}
