import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v441',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="441c1">
      Bei Ermittlung der Obergrenze der Glukosewerte in der Tagesgrafik werden nun auch die temporären
      Zielbereiche berücksichtigt.
    </li>
  </ul>`,
  standalone: true
})
export class V441 extends HistoryBase {
  data = [441, 20241213];
}
