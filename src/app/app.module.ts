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
import {WhatsNewComponent} from './components/whats-new/whats-new.component';
import {MainComponent} from './components/main/main.component';
import {ImpressumComponent} from './components/impressum/impressum.component';
import {DsgvoComponent} from './components/dsgvo/dsgvo.component';
import {HelpviewComponent} from './components/helpview/helpview.component';
import {SettingsComponent} from './components/settings/settings.component';
import {TestComponent} from './components/test/test.component';
import {GlucAdjustComponent} from './controls/gluc-adjust/gluc-adjust.component';
import {WelcomeComponent} from './components/welcome/welcome.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {ViewTileComponent} from './components/view-tile/view-tile.component';
import {ViewListComponent} from './components/view-list/view-list.component';
import {OwlMenuComponent} from './components/owl-menu/owl-menu.component';
import {WatchComponent} from './components/watch/watch.component';
import {WatchEntryComponent} from './controls/watch-entry/watch-entry.component';
import {OutputParamsComponent} from './components/output-params/output-params.component';
import { DartImporterComponent } from './components/dart-importer/dart-importer.component';
import { ProgressComponent } from './components/progress/progress.component';

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
    WhatsNewComponent,
    MainComponent,
    ImpressumComponent,
    DsgvoComponent,
    HelpviewComponent,
    SettingsComponent,
    TestComponent,
    GlucAdjustComponent,
    WelcomeComponent,
    ViewTileComponent,
    ViewListComponent,
    OwlMenuComponent,
    WatchComponent,
    WatchEntryComponent,
    OutputParamsComponent,
    DartImporterComponent,
    ProgressComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MaterialModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    DragDropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
