import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v440',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="440a1">
      Bei Auswertung der Behandlungen wurden Bolus Wizard Einträge ignoriert. Auch diese
      werden jetzt berücksichtigt, solange es keinen Eintrag mit gleichem Zeitpunkt gibt,
      der einen Mahlzeitbolus beinhaltet.
    </li>
  </ul>`,
  standalone: true
})
export class V440 extends HistoryBase {
  data = [440, 20240823];
}
