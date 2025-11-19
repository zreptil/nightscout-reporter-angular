import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v445',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="445a1">
      In den Formularparametern des Formulars "Tagesstatistik" gibt es jetzt die Möglichkeit,
      die Ausgabe zu gruppieren. Wenn die Ausgaben gruppiert werden, wird entsprechend der
      Gruppierung eine Summenzeile eingefügt. Die Zeilen für die einzelnen Tage können dann auch
      ausgeblendet werden, so dass man eine Übersicht über die entsprechende Gruppierung
      erhält. Aktuell sind Gruppierungen nach Woche und Monat möglich.<br>
      Bei der Gruppierung nach der Woche wird berücksichtigt, welcher Wochentag bei der Festlegung
      des Zeitraums den Beginn der Woche definiert. Das ist immer der Wochentag, der in der Titelzeile
      des Kalenders ganz links steht. Wenn man diesen ändern möchte, braucht man nur den entsprechenden
      Wochentag anklicken. In Deutschland ist das üblicherweise der Montag. In der Tabelle wird
      in der ersten Spalte die Woche im Jahr angezeigt und darunter der erste und der letzte Tag der Woche.
      Wenn vor dem ersten Tag \u2026 steht, dann bedeutet das, dass die Woche nicht mit dem ersten
      Weochentag anfängt. Das ist normalerweise bei der ersten Woche der Fall, wenn man relative
      Zeiten festlegt, da diese selten genau am Wochenstart beginnen. Das Gleiche gilt für die letzte
      Zeile, die vermutlich eher selten mit dem letzten Wochentag endet. Dann steht hinter dem letzten
      Datum auch das Zeichen \u2026.<br>
      Bei der Gruppierung nach Monat wird der Monatsname in der ersten Spalte angezeigt. Wenn der
      erste Tag der Gruppe nicht der erste Tag des Monats ist, wird dieses Datum über dem Monatsnamen
      angezeigt. Wenn der letzte Tag der Gruppe nicht der letzte Tag im Monat ist, wird dieses Datum
      unter dem Monatsnamen angezeigt.
    </li>
    <li class="added" i18n="445a2">
      Der Dialog zur Zeitraumauswahl wurde erweitert. Es werden jetzt auch die Wochennummern angezeigt.
      Ausserdem ist es möglich, durch Anklicken des Monatsnamen zu dem gewünschten Monat zu navigieren.
      Dabei wird mit den Navigationsbuttons links und rechts das Jahr erhöht oder verringert. Die Monate
      und Jahre werden entsprechend der aktuellen Zeitraumauswahl eingefärbt. Durch Anklicken des Jahres
      kann auch dieses schnell gewechselt werden. Durch Anklicken eines Monats oder Jahres in der Liste
      wird dann zu der entsprechenden Ansicht gewechselt. Die Zeitraumänderung erfolgt nach wie vor
      durch Anklicken der Schnellauswahl unter dem Kalender oder durch Anklicken der Tage innerhalb
      eines Monats. Das Jahr und der Monat dienen nur zur schnelleren Navigation zum gewünschten Datum.
    </li>
    <li class="fixed" i18n="445f1">
      Die Anzeige des Basalinsulins im Formular "Tagesstatistik" wurde korrigiert.
    </li>
  </ul>`,
  standalone: true
})
export class V445 extends HistoryBase {
  data = [445, 20251119];
}
