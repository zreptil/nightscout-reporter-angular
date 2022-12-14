/***************************************************************************************************
 * Load `$localize` onto the global scope - used if i18n tags appear in Angular templates.
 */
import '@angular/localize/init';
import 'zone.js';
import * as messages from 'src/assets/messages.json';
/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import {loadTranslations} from '@angular/localize'; // Included with Angular CLI.
const check = JSON.parse(localStorage.getItem('webData'))?.w1 || 'de-DE';
console.log('guck nach sprache', check);
let lng = (messages as any).default.find((lang: any) => lang.id === check);
if (lng == null) {
  lng = (messages as any).default[0];
}
loadTranslations(lng.data);
