import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v443',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="changed" i18n="443c1">
      Die Grenzwerte in der Analyse werden jetzt so berechnet, dass sie aufsummiert
      100% ergeben. Durch Rundungen kam es da teilweise zu Abweichungen.
    </li>
    <li class="changed" i18n="443c2">
      In den Formularparametern des Protkolls wird die Option "Mehrfache Datensätze kennzeichnen"
      jetzt nicht mehr markiert, wenn die Checkbox für alle Markierungen in der Titelzeile
      des Dialogs angeklickt wird, da diese Option dazu führen kann, dass kein vernünftiges
      Protokoll mehr erstellt wird.
    </li>
  </ul>`,
  standalone: true
})
export class V443 extends HistoryBase {
  data = [443, 20250918];
}
