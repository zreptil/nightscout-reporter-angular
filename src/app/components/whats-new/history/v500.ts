import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v500',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="500a1">
      In <a href="/watch" target="_blank">NightWatch</a> gibt es jetzt die Möglichkeit, bei den Einträgen
      mit Laufzeiten diese so anzuzeigen, dass der Rest der Laufzeit angezeigt wird und nicht, wie lange
      es schon läuft. Die Restlaufzeit ergibt sich aus dem Zeitpunkt des Wechsels in den Behandlungen und
      der in der entsprechenden Variablen, die mit _URGENT endet angegebenen Laufzeit.
    </li>
    <li class="added" i18n="500a2">
      In <a href="/watch" target="_blank">NightWatch</a> gibt es eine neue Anzeige für Pumpeninformationen. Diese sind am Icon
      <img alt="Pumpeninformationen" src="assets/img/pump.print.png"> erkennbar.
      Dort wird angezeigt, wie lange die letzte Verbindung zur Pumpe zurück liegt,
      wieviel Insulin noch im Reservoir ist und der Status der Pumpe.
    </li>
    <li class="added" i18n="500a3">
      In den Einstellungen gibt es für die Benutzer jetzt ein zusätzliches Feld für
      Bemerkungen zu diesem Benutzer. Diese kann auch als Information in der Benutzerliste
      angezeigt werden.
    </li>
    <li class="changed" i18n="500c1">
      Die Einstellung für die Anzeige der Kacheln wurde erweitert. Jetzt kann man
      auch das Bild und den Text gleichzeitig auf den Kacheln anzeigen lassen. Das
      erleichtert es okularherausgeforderten Menschen wie mir, die Formulare besser
      zu erkennen.
    </li>
    <li class="changed" i18n="500c2">
      Das Formular Tagesanalyse wurde überarbeitet. Man kann jetzt in den Formularparametern
      festlegen, welche Analysen ausgegeben werden sollen. Die Grafiken werden dann so
      skaliert, dass sie die gesamte Seite füllen.
    </li>
    <li class="fixed" i18n="500f1">
      Das Nightscout Reporter Icon beim Laden der Seite wurde wieder aktiviert.
    </li>
    <li class="fixed" i18n="500f2">
      Im Formular "Tagesstatistik" wird die Spaltenanzahl nun korrekt überprüft und
      limitiert.
    </li>
  </ul>`,
  standalone: true
})
export class V500 extends HistoryBase {
  data = [500, 20261231];
}
