import '@angular/localize/init';
import 'zone.js';
import {LanguageService} from '@/_services/language.service';

const srv = new LanguageService();
srv.activate(JSON.parse(localStorage.getItem('webData'))?.w1 || 'de-DE');
