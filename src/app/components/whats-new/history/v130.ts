import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v130',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="v130a1">
      Das "Comprehensive Glucose Pentagon" (Umfassendes Glukose Fünfeck) wurde als eigenes PDF und als Zusatzseite
      zur Tagesgrafik und Wochengrafik hinzugefügt. Es handelt sich hierbei um eine Darstellung von fünf
      Messgrössen, mit deren Hilfe sich die Qualität der Therapie ermitteln und mit anderen vergleichen lässt. Auf
      den Ausdrucken wird ein Verweis auf die zugrunde liegende Abhandlung ausgegeben.
    </li>
    <li class="added" i18n="v130a2">
      In der Tagesgrafik gibt es eine Option, die berechneten IE für aufgenommene Kohlenhydrate anzeigen zu lassen.
      Der Wert, der unmittelbar unter den Kohlenhydraten angezeigt wird, entspricht dem Bolus, der zu diesem
      Zeitpunkt für diese Kohlenhydratmenge abgegeben werden sollte. Dieser Wert kann niedriger als der tatsächlich
      abgegebene Wert ausfallen, weil für die Insulinabgabe noch IOB und andere Faktoren berücksichtigt werden.
    </li>
    <li class="added" i18n="v130a3">
      In der Tagesgrafik werden nun auch bei Anzeige des Zielwertes die temporären Ziele berücksichtigt.
    </li>
    <li class="added" i18n="v130a4">
      In der Auswertung gibt es eine neue Option, um den Standardbereich feiner abzustufen. Dort werden dann
      zusätzlich sehr hohe Werte und sehr niedrige Werte angezeigt.
    </li>
    <li class="added" i18n="v130a5">
      Nightscout Reporter kann nun auch in Japanisch verwendet werden.
    </li>
    <li class="added" i18n="v130a6">
      Es ist jetzt möglich, die Buttons zur PDF-Auswahl als Kacheln darstellen zu lassen. Die Option dazu ist im
      Menü auf der linken Seite zu finden. In der Kachelansicht werden die Buttons über die verfügbare Fläche
      verteilt und sind so auf kleinen Geräten leichter zu treffen. Ausserdem sieht man dann normalerweise alle
      verfügbaren PDFs auf einen Blick und muss nicht scrollen. Auf den aktivierten Kacheln wird angezeigt,
      an welcher Stelle im PDF die entsprechenden Seiten ausgegeben werden und wieviele Seiten die entsprechende
      Kachel ausgibt. Diese Zahl kann für die meisten Kacheln korrekt ermittelt werden, bei einigen ist das aber
      ohne Auswertung der Daten nicht möglich (z.B. Profile und Protokoll). In diesem Fall wird entweder keine
      Seitenzahl oder eine Mindestzahl an Seiten angegeben. Sobald die Erstellung des PDFs erfolgt ist, werden
      die korrekten Zahlen angezeigt. Die Reihenfolge der Kacheln kann verändert werden, indem man sie festhält
      und an die Stelle verschiebt, an der man sie gerne hätte. Nach Anklicken des Icons in der oberen rechten
      Ecke können die Parameter für das entsprechende PDF erfasst werden.
    </li>
    <li class="added" i18n="v130a7">
      Im Profil werden nun die Gesamtsumme der Basalrate und die durchschnittlichen Werte für ICR und ISF
      pro Stunde angezeigt.
    </li>
    <li class="added" i18n="v130a8">
      Optionen für die PDFs, die eine eindeutige Beziehung zu einem laufenden Loop haben, werden nun in Blau
      dargestellt. Das vereinfacht es, PDFs zu erstellen, denen man nicht ohne Weiteres entnehmen kann, dass
      ein Loop vorliegt. Dazu müssen nur die Haken bei den blauen Optionen entfernt werden.
    </li>
    <li class="changed" i18n="v130c1">
      Die Basalratenprofile für den Tag werden nun auch anhand der Behandlungsdaten ermittelt. Profilwechsel
      werden in der Tagesgrafik angezeigt und sollten ab dem Zeitpunkt des Wechsels auch eine korrekte
      Basalratenanpassung anzeigen.
    </li>
    <li class="changed" i18n="v130c2">
      Die Seiten Profil und Basalrate zeigen nun bei einem Profil, das nur temporär während eines Tages aktiv war
      den Zeitraum an, in dem es aktiv war.
    </li>
    <li class="changed" i18n="v130c3">
      Die Buttons für die vergangenen Perioden werden nicht angezeigt, wenn kein Zeitraum oder kein PDF ausgewählt
      wurde.
    </li>
    <li class="changed" i18n="v130c4">
      Einige der Optionen für die PDFs wurden hierarchisch angeordnet. Es macht z.B. keinen Sinn, die SMB Werte
      in der Tagesgrafik an der Kurve platzieren zu lassen, wenn die SMB Werte gar nicht angezeigt werden. Deswegen
      werden Optionen, die von einer anderen Option abhängen nur dann angezeigt, wenn die entsprechende Option
      markiert ist. Dadurch ändert sich leider auch die Speicherung der Optionen, weshalb sich die aktuelle
      Auswahl der Optionen bei manchen PDFs verändert. Da müssen die Optionen dann neu gesetzt werden.
    </li>
    <li class="changed" i18n="v130c5">
      Die Auswahl des Zeitraums und der Benutzer wurde in die Titelzeile verschoben.
    </li>
    <li class="fixed" i18n="v130f1">
      Die Ermittlung der Einheit (mg/dl oder mmol/l) wird nun flexibler gehandhabt, so dass auch Leerzeichen
      in der entsprechenden Einstellung nicht mehr zu einer Fehlinterpretation führen.
    </li>
    <li class="fixed" i18n="v130f2">
      Ein Fehler wurde behoben, der in der Tagesgrafik dazu führte, dass Texte in der Legende andere Texte
      überschrieben haben.
    </li>
    <li class="fixed" i18n="v130f3">
      Die Berechnung der PDF-Grössen wurde korrigiert, so dass nun weniger PDFs erstellt werden, wenn sie aufgrund
      der Grösse aufgeteilt werden.
    </li>
    <li class="fixed" i18n="v130f4">
      Zur Berechnung der Analyse, Tagesstatistik und Tagesgrafik wird nun die gleiche Datenbasis verwendet, so dass
      die Werte auf allen PDFs gleich sind.
    </li>
    <li class="fixed" i18n="v130f5">
      Es werden jetzt auch blutige Werte erkannt, die von Loop auf dem IPhone eingetragen werden.
    </li>
  </ul>
  `,
  standalone: true
})
export class V130 extends HistoryBase {
  data = [130, 20190819];
}
