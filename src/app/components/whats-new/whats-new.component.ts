import {AfterViewInit, Component} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import {Utils} from '@/classes/utils';

@Component({
  selector: 'app-whats-new',
  templateUrl: './whats-new.component.html',
  styleUrls: ['./whats-new.component.scss'],
  standalone: false,
})
export class WhatsNewComponent implements AfterViewInit {

  checkId = +GLOBALS.version.replace(/[.-]/g, '');
  closeData: CloseButtonData = {
    colorKey: 'whatsnew'
  };

  constructor(public http: HttpClient,
              public sanitizer: DomSanitizer) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get originUrl(): string {
    return location.origin.replace(/\/$/, '');
  }

  version(section: any): string {
    const ret: string[] = [section.display];
    ret.push(Utils.fmtDate(Utils.parseDate(`${section.date}`)));
    return Utils.join(ret, ' - ');
  }

  classFor(id: number): string[] {
    const ret: string[] = [];
    if (id !== +this.checkId) {
      // ret.push('hidden');
    }
    return ret;
  }

  ngAfterViewInit(): void {
  }

  click(id: number): void {
    this.checkId = id;
  }
}
