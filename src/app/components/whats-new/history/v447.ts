import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v447',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="447a1">
      Nightscout Reporter ermittelt jetzt automatisch den letzten HbA1C-Laborwert aus den Notizen
      der Behandlungen. Wenn eine Notiz erfasst wurde, die den Text "a1c" enthält, wird der
      HbA1C-Wert automatisch aus der Zahl danach extrahiert. Beispiele für erkennbare Notizen:<br><br>
      <i>
        HbA1C: 6,5%<br>
        HbA1C 6.7<br>
        Mein a1c Wert war 5,3. Das finde ich super<br><br>
      </i>
      Wenn so eine Notiz erkannt wird, dann wird sie in der Analyse unterhalb des geschätzten
      HbA1C-Wertes als Labor HbA1C mit entsprechendem Datum angezeigt.
    </li>
  </ul>`,
  standalone: true
})
export class V447 extends HistoryBase {
  data = [447, 20260427];
}
