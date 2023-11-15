import {enableProdMode} from '@angular/core';
import {environment} from '@environments/environment';
import {bootstrapApplication} from '@angular/platform-browser';
import {LocalToolsComponent} from '@/standalone/local-tools/local-tools.component';

if (environment.isProduction) {
  enableProdMode();
}

bootstrapApplication(LocalToolsComponent)
  .catch(err => console.error(err));
