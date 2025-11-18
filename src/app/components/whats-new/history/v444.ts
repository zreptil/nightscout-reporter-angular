import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v444',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="444a1">
      Emojis in Notizen können jetzt auch dargestellt werden. Aktuell werden
      die Notizen auf den Formularen Protokoll und Tagesgrafik ausgegeben,
    </li>
    <li class="added" i18n="444a2">
      In den Ausgabe Parametern gibt es einen neuen Parameter, der steuert, wie
      Emojis dargestellt werden. Er heisst "Emojis als Bilder einbinden". Wenn diese
      Option markiert ist, werden die Emojis als Bilder ins PDF eingebunden, wenn es
      möglich ist, sie aus dem Github-Repository von Google herunterzuladen. Ansonsten
      werden sie als Zeichen aus dem Noto-Emoji Zeichensatz dargestellt.
    </li>
  </ul>`,
  standalone: true
})
export class V444 extends HistoryBase {
  data = [444, 20251107];
}
