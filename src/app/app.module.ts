import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {AutofocusDirective} from '@/_directives/autofocus.directive';
import {DialogComponent} from '@/components/dialog/dialog.component';
import {ColorPickerDialog} from '@/controls/color-picker/color-picker-dialog/color-picker-dialog';
import {ColorPickerComponent} from '@/controls/color-picker/color-picker.component';
import {ColorPickerImageComponent} from '@/controls/color-picker/color-picker-image/color-picker-image.component';
import {ColorPickerMixerComponent} from '@/controls/color-picker/color-picker-mixer/color-picker-mixer.component';
import {ColorPickerBaseComponent} from '@/controls/color-picker/color-picker-base.component';
import {ColorPickerSliderComponent} from '@/controls/color-picker/color-picker-slider/color-picker-slider.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
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
import {DatepickerComponent} from './controls/datepicker/datepicker.component';
import {DatepickerMonthComponent} from './controls/datepicker/datepicker-month/datepicker-month.component';
import {DatepickerDialogComponent} from './controls/datepicker/datepicker-dialog/datepicker-dialog.component';
import {ShortcutEditComponent} from './components/shortcut-edit/shortcut-edit.component';
import {FormParamsDialogComponent} from './components/form-params-dialog/form-params-dialog.component';
import {FormParamsComponent} from './controls/form-params/form-params.component';
import {ViewUsersComponent} from './components/view-users/view-users.component';
import {ShortcutComponent} from './components/shortcut/shortcut.component';
import {WatchSettingsComponent} from './components/watch-settings/watch-settings.component';
import {WatchGroupComponent} from './components/watch-group/watch-group.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {InfoButtonComponent} from './controls/info-button/info-button.component';
import {HideMissingImageDirective} from '@/_directives/hide-missing-image.directive';
import {ColorCfgComponent} from '@/controls/color-cfg/color-cfg.component';
import {ColorEditDirective} from '@/_directives/color-edit.directive';
import {ColorPickerHslComponent} from '@/controls/color-picker/color-picker-hsl/color-picker-hsl.component';
import {CloseButtonComponent} from './controls/close-button/close-button.component';
import {ColorCfgDialogComponent} from './controls/color-cfg/color-cfg-dialog/color-cfg-dialog.component';
import {ViewThemesComponent} from './components/view-themes/view-themes.component';
import {ExecuteComponent} from './components/execute/execute.component';
import {ClipboardModule} from '@angular/cdk/clipboard';
import {TextareaAutoresizeDirective} from '@/_directives/textarea-autoresize.directive';
import {LaunchComponent} from '@/components/launch/launch.component';
import {ProgressComponent} from '@/components/progress/progress.component';
import {LogComponent} from '@/components/log/log.component';
import {OAuthModule} from 'angular-oauth2-oidc';
import {MAT_DIALOG_DEFAULT_OPTIONS} from '@angular/material/dialog';
import {HistoryModule} from '@/history.module';
import {ScrollShadowDirective} from '@/_directives/scroll-shadow.directive';

@NgModule({
  declarations: [
    AutofocusDirective,
    HideMissingImageDirective,
    AppComponent,
    DialogComponent,
    ColorPickerComponent,
    ColorPickerDialog,
    ColorPickerImageComponent,
    ColorPickerMixerComponent,
    ColorPickerBaseComponent,
    ColorPickerSliderComponent,
    ColorPickerHslComponent,
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
    ShortcutComponent,
    WatchSettingsComponent,
    WatchGroupComponent,
    InfoButtonComponent,
    ColorCfgComponent,
    ColorEditDirective,
    CloseButtonComponent,
    ColorCfgDialogComponent,
    ViewThemesComponent,
    ExecuteComponent,
    LaunchComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    MaterialModule,
    ReactiveFormsModule,
    AppRoutingModule,
    DragDropModule,
    BrowserAnimationsModule,
    ClipboardModule,
    ProgressComponent,
    LogComponent,
    HistoryModule,
    OAuthModule.forRoot(),
    TextareaAutoresizeDirective,
  ], providers: [
    TextareaAutoresizeDirective, ScrollShadowDirective,
    provideHttpClient(withInterceptorsFromDi()),
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {autoFocus: 'dialog', restoreFocus: true}}
  ]
})
export class AppModule {
}
