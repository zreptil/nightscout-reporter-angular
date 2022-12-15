/***************************************************************************************************
 * Load `$localize` onto the global scope - used if i18n tags appear in Angular templates.
 */
import '@angular/localize/init';
import 'zone.js';
import * as messages from 'src/assets/messages.json';
/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import {loadTranslations} from '@angular/localize';
import {registerLocaleData} from '@angular/common';

import de from '@angular/common/locales/de';
import enGB from '@angular/common/locales/en-GB';
import enUS from '@angular/common/locales/en';
import esES from '@angular/common/locales/es';
import plPL from '@angular/common/locales/pl';
import jaJP from '@angular/common/locales/ja';
import skSK from '@angular/common/locales/sk';
import ptPT from '@angular/common/locales/pt-PT';
import frFR from '@angular/common/locales/fr';
import noNO from '@angular/common/locales/no';
import nlNL from '@angular/common/locales/nl';
import ruRU from '@angular/common/locales/ru';

const check = JSON.parse(localStorage.getItem('webData'))?.w1 || 'de-DE';
let lng = (messages as any).default.find((lang: any) => lang.id === check);
if (lng == null) {
  lng = (messages as any).default[0];
}
loadTranslations(lng.data);
registerLocaleData(({
  'de-DE': de,
  'en-GB': enGB,
  'en-US': enUS,
  'es-ES': esES,
  'fr-FR': frFR,
  'ja-JP': jaJP,
  'nl-NL': nlNL,
  'no-NO': noNO,
  'pl-PL': plPL,
  'pt-PT': ptPT,
  'ru-RU': ruRU,
  'sk-SK': skSK
} as any)[lng.id]);

