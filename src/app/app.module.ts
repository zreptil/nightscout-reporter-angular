import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {AutofocusDirective} from '@/_directives/autofocus.directive';
import {DialogComponent} from '@/components/dialog/dialog.component';
import {ColorPickerDialog} from '@/controls/color-picker/color-picker-dialog';
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
import {ProgressComponent} from './components/progress/progress.component';
import {DatepickerComponent} from './controls/datepicker/datepicker.component';
import {DatepickerMonthComponent} from './controls/datepicker/datepicker-month/datepicker-month.component';
import {DatepickerDialogComponent} from './controls/datepicker/datepicker-dialog/datepicker-dialog.component';
import {ShortcutEditComponent} from './components/shortcut-edit/shortcut-edit.component';
import {FormParamsDialogComponent} from './components/form-params-dialog/form-params-dialog.component';
import {FormParamsComponent} from './controls/form-params/form-params.component';
import {LocalToolsComponent} from '@/standalone/local-tools/local-tools.component';
import {ViewUsersComponent} from './components/view-users/view-users.component';
import { ShortcutComponent } from './components/shortcut/shortcut.component';

@NgModule({
  declarations: [
    AutofocusDirective,
    AppComponent,
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
    DatepickerComponent,
    DatepickerMonthComponent,
    DatepickerDialogComponent,
    ShortcutEditComponent,
    FormParamsDialogComponent,
    FormParamsComponent,
    ViewUsersComponent,
    ShortcutComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MaterialModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    DragDropModule,
    LogComponent,
    ProgressComponent,
    LocalToolsComponent
  ],
  providers: [
    // {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
