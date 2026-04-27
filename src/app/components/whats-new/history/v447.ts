import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v447',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="447a1">
      Im Formular Analyse gibt es einen neuen Wert GMI. Dieser basiert auf diesem Artikel:<br>
      <a
        href="https://www.medcentral.com/endocrinology/diabetes/glucose-management-indicator-replaces-ea1c-patients-with-cgm-sensors"
        target="_blank">
        Glucose Management Indicator Replaces eA1c in Patients with CGM Sensors
      </a>
    </li>
  </ul>`,
  standalone: true
})
export class V447 extends HistoryBase {
  data = [447, 20260427];
}
