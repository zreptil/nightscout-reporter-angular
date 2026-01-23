import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v446',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="446a1">
      Im Formular Analyse ist es jetzt möglich den GRI auszublenden.
    </li>
  </ul>`,
  standalone: true
})
export class V446 extends HistoryBase {
  data = [446, 20260123];
}
