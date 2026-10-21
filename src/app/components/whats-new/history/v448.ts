import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v448',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="448a1">
      Die Anzeige der temporären Ziele wurde korrigiert. Sie werden jetzt korrekt mit ihrer
      entsprechenden Länge angezeigt.
    </li>
  </ul>`,
  standalone: true
})
export class V448 extends HistoryBase {
  data = [448, 20261021];
}
