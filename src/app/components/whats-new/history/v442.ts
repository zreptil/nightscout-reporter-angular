import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v442',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="442c1">
      Der Glykämische Risiko Index (GRI) wurde in der Auswertung hinzugefügt. Hier
      gibt es nähere Informationen dazu:
      <a href="https://www.diabetestechnology.org/gri" target="_blank">
        https://www.diabetestechnology.org/gri
      </a>
    </li>
  </ul>`,
  standalone: true
})
export class V442 extends HistoryBase {
  data = [442, 20250806];
}
