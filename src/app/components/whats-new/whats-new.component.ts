import {AfterViewInit, Component} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {CloseButtonData} from '@/controls/close-button/close-button-data';

@Component({
  selector: 'app-whats-new',
  templateUrl: './whats-new.component.html',
  styleUrls: ['./whats-new.component.scss'],
  standalone: false
})
export class WhatsNewComponent implements AfterViewInit {

  checkId = +GLOBALS.version.replace(/[.-]/g, '');
  closeData: CloseButtonData = {
    colorKey: 'whatsnew'
  };

  constructor() {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get originUrl(): string {
    return location.origin.replace(/\/$/, '');
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
