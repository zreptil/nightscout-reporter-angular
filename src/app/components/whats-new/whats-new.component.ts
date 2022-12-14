import {AfterViewInit, Component} from '@angular/core';
import {GLOBALS} from '@/_model/globals-data';

@Component({
  selector: 'app-whats-new',
  templateUrl: './whats-new.component.html',
  styleUrls: ['./whats-new.component.scss']
})
export class WhatsNewComponent implements AfterViewInit {

  checkId = +GLOBALS.version.replace('.', '');

  constructor() {
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
