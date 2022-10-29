import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {AutofocusDirective} from '@/_directives/autofocus.directive';
import {TextareaAutoresizeDirective} from '@/_directives/textarea-autoresize.directive';
import {DialogComponent} from '@/components/dialog/dialog.component';
import {ColorPickerDialog} from '@/controls/color-picker/color-picker-dialog';
import {LogPipe} from '@/components/log/log.pipe';
import {LogComponent} from '@/components/log/log.component';
import {ColorPickerComponent} from '@/controls/color-picker/color-picker.component';
import {ColorPickerImageComponent} from '@/controls/color-picker/color-picker-image/color-picker-image.component';
import {ColorPickerMixerComponent} from '@/controls/color-picker/color-picker-mixer/color-picker-mixer.component';
import {ColorPickerBaseComponent} from '@/controls/color-picker/color-picker-base.component';
import {ColorPickerRGBComponent} from '@/controls/color-picker/color-picker-rgb/color-picker-rgb.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {MaterialModule} from '@/material.module';
import {AppRoutingModule} from '@/app-routing.module';
import { MainComponent } from './components/main/main.component';
import { WhatsNewComponent } from './components/whats-new/whats-new.component';
import { StartComponent } from './components/start/start.component';
import { ImpressumComponent } from './components/impressum/impressum.component';
import { DsgvoComponent } from './components/dsgvo/dsgvo.component';
import { HelpviewComponent } from './components/helpview/helpview.component';
import { SettingsComponent } from './components/settings/settings.component';

@NgModule({
  declarations: [
    AutofocusDirective,
    TextareaAutoresizeDirective,
    LogPipe,
    AppComponent,
    LogComponent,
    DialogComponent,
    ColorPickerComponent,
    ColorPickerDialog,
    ColorPickerImageComponent,
    ColorPickerMixerComponent,
    ColorPickerBaseComponent,
    ColorPickerRGBComponent,
    MainComponent,
    WhatsNewComponent,
    StartComponent,
    ImpressumComponent,
    DsgvoComponent,
    HelpviewComponent,
    SettingsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MaterialModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
