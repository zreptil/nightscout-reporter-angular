import {Component} from '@angular/core';
import {registerLocaleData} from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeEnGB from '@angular/common/locales/en-GB';
import localeEnUS from '@angular/common/locales/en';

registerLocaleData(localeDe);
registerLocaleData(localeEnGB);
registerLocaleData(localeEnUS);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor() {
  }
}
