import {Log} from '@/_services/log.service';

export class ThemeData {
  /**
   * the icons for the special keys
   */
  static icons: any = {
    back: 'water_drop',
    fore: 'title',
    data: 'edit_note',
    link: 'link',
    subhead: 'format_bold'
  }
  /**
   * collection of colorkey-endings for specialGroups
   */
  static specialKeys: any = {
    Fore: {icon: ThemeData.icons.fore, title: $localize`Text`},
    Data: {icon: ThemeData.icons.data, title: $localize`Daten`},
    Link: {icon: ThemeData.icons.link, title: $localize`Link`},
    SubHead: {icon: ThemeData.icons.subhead, title: $localize`Überschrift`},
  };
  /**
   * all colorkeys that end with a key from specialGroups will
   * be shown in the colorDialog as one line with all of the colors
   * that have the same colorkey up to the key ending with one of
   * the entries in keys.
   * e.g. mainBodyBack will contain in one line
   * mainBodyBack, mainBodyFore, mainBodyData, mainBodyLink, mainBodySubHead
   */
  static specialGroups: any = {
    Back: {keys: ThemeData.specialKeys, title: $localize`Hintergrund`},
    RGB: {keys: ThemeData.specialKeys, title: $localize`Hintergrund`},
    Frame: {keys: ThemeData.specialKeys, title: $localize`Rahmen`}
  };
  /**
   * the names for the given colors
   */
  static colorData: any = {
    mainHead: {title: $localize`Titel`},
    mainBody: {title: $localize`Inhalt`},
    settingsHead: {title: $localize`Titel`},
    settingsBody: {title: $localize`Inhalt`},
    settingsError: {title: $localize`Fehler`},
    legalHead: {title: $localize`Titel`},
    legalBody: {title: $localize`Inhalt`},
    whatsnewHead: {title: $localize`Titel`},
    whatsnewBody: {title: $localize`Inhalt`},
    local: {title: $localize`Lokal`, debugOnly: true},
    betaBack: {title: $localize`Beta`},
    settingsLoopMarked: {title: $localize`Kennzeichnung für Loop`},
    outputparamsHead: {title: $localize`Titel`},
    outputparamsBody: {title: $localize`Inhalt`},
    shortcutHead: {title: $localize`Titel`},
    shortcutBody: {title: $localize`Inhalt`},
    helpHead: {title: $localize`Titel`},
    helpBody: {title: $localize`Inhalt`},
    glucLow: {title: $localize`Glukose Niedrig`},
    glucNormLow: {title: $localize`Glukose Normal Niedrig`},
    glucNorm: {title: $localize`Glukose Normal`},
    glucNormHigh: {title: $localize`Glukose Normal Hoch`},
    glucHigh: {title: $localize`Glukose Hoch`},
    glucUnknown: {title: $localize`Glukose Unbekannt`},
    datepickerBtnEmpty: {title: $localize`Leerer Zeitraum`},
    datepickerHeadEmpty: {title: $localize`Titelbereich für leeres Datum`},
    datepickerHead: {title: $localize`Titel`},
    datepickerBodyBack: {title: $localize`Inhalt`},
    datepickerMonthTitle: {title: $localize`Monat Titel`},
    datepickerMonth: {title: $localize`Monat Inhalt`},
    datepickerBtnRaised: {title: $localize`Markierter Tag`},
    datepickerBtnRaisedKey: {title: $localize`Markierte relative Zeitspanne`},
    datepickerBtnShiftKey: {title: $localize`Verschiebung`},
    datepickerDowActive: {title: $localize`Aktiver Wochentag`},
    datepickerDowInactive: {title: $localize`Inaktiver Wochentag`},
    datepickerBody: {title: $localize`Hintergrund`},
    mainSendCount: {title: $localize`Anzahl Formulare`},
    mainDonate: {title: $localize`Spendenbutton`},
    userPinFore: {title: $localize`Sternmarkierung`},
    logDebug: {title: $localize`Debug`},
    dlgErrorHead: {title: $localize`Dialog Fehler Titel`},
    dlgErrorBody: {title: $localize`Dialog Fehler Inhalt`},
    dlgWarnHead: {title: $localize`Dialog Warnung Titel`},
    dlgWarnBody: {title: $localize`Dialog Warnung Inhalt`},
    owlBody: {title: $localize`Körper`, debugOnly: true},
    owlBrow: {title: $localize`Stirn`, debugOnly: true},
    owlBodyLeft: {title: $localize`Körper links`, debugOnly: true},
    owlBodyRight: {title: $localize`Körper rechts`, debugOnly: true},
    owlEyearea: {title: $localize`Augenpartie`, debugOnly: true},
    owlEyes: {title: $localize`Augen`, debugOnly: true},
    owlXmasBodyLeft: {title: $localize`Weihnacht - Körper links`, debugOnly: true},
    owlXmasBodyRight: {title: $localize`Weihnacht - Körper rechts`, debugOnly: true},
    owlXmasEyearea: {title: $localize`Weihnacht - Augenpartie`, debugOnly: true},
    owlXmasEyes: {title: $localize`Weihnacht - Augen`, debugOnly: true},
    owlXmasFrame: {title: $localize`Weihnacht - Hut Rand`, debugOnly: true},
    owlXmasFur: {title: $localize`Weihnacht - Hut Fell`, debugOnly: true},
    owlXmasFabric: {title: $localize`Weihnacht - Hut Stoff`, debugOnly: true},
    owlWizardBodyLeft: {title: $localize`Zauberer - Körper links`, debugOnly: true},
    owlWizardBodyRight: {title: $localize`Zauberer - Körper rechts`, debugOnly: true},
    owlWizardEyearea: {title: $localize`Zauberer - Augenpartie`, debugOnly: true},
    owlWizardEyes: {title: $localize`Zauberer - Augen`, debugOnly: true},
    owlWizardFabric: {title: $localize`Zauberer - Hut Stoff`, debugOnly: true},
    owlWizardStar2: {title: $localize`Zauberer - Hut Stern 2`, debugOnly: true},
    owlWizardStar1: {title: $localize`Zauberer - Hut Stern 1`, debugOnly: true},
    owlReporterFrame: {title: $localize`Reporterhut - Rand`, debugOnly: true},
    owlReporterFabric: {title: $localize`Reporterhut - Stoff`, debugOnly: true},
    owlOwnBodyLeft: {titleDebug: $localize`Angepasst - Körper links`, title: $localize`Körper links`},
    owlOwnBodyRight: {titleDebug: $localize`Angepasst - Körper rechts`, title: $localize`Körper rechts`},
    owlOwnEyearea: {titleDebug: $localize`Angepasst - Augenpartie`, title: $localize`Augenpartie`},
    owlOwnEyes: {titleDebug: $localize`Angepasst - Augen`, title: $localize`Augen`},
    owlOwnFabric: {titleDebug: $localize`Angepasst - Stoff`, title: $localize`Stoff`},
    owlOwnBeard: {titleDebug: $localize`Angepasst - Bart`, title: $localize`Bart`},
    owlOwnFrame: {titleDebug: $localize`Angepasst - Rand`, title: $localize`Rand`},
    owlOwnBrow: {titleDebug: $localize`Angepasst - Stirn`, title: $localize`Stirn`},
  };
  /**
   * the labels and parameters for the colorkeys
   */
  static colorMapping: any = {
    owl: {title: $localize`Eule`},
    datepicker: {title: $localize`Datumsauswahl`},
    gluc: {title: $localize`Glukosewerte`},
    google: {title: $localize`Google`},
    info: {title: $localize`Info`},
    help: {title: $localize`Hilfe`},
    legal: {title: $localize`Gesetzliches`},
    whatsnew: {title: $localize`Was bisher geschah...`},
    shortcut: {title: $localize`Shortcut`},
    settings: {title: $localize`Einstellungen`},
    watchsettings: {title: $localize`Watch Einstellungen`},
    log: {title: $localize`Log`, debugOnly: true},
    local: {title: $localize`Lokal`, debugOnly: true},
    beta: {title: $localize`Beta`, debugOnly: true},
    debug: {title: $localize`Debug`, debugOnly: true},
    outputparams: {title: $localize`Ausgabe Parameter`},
    main: {title: $localize`Hauptseite`},
    dlgError: {title: $localize`Dialog`},
    user: {title: $localize`Benutzer`},
    dialog: {title: $localize`Dialog`},
  }

  /**
   * the colorkeys given here are additionally displayed
   * in the color-selection-dialog for the given colorkey
   */
  static additionalColorsFor: any = {
    outputparams: ['settingsLoopMarked', 'datepickerBtnEmpty'],
    main: ['userPinFore', 'local', 'beta', 'log'],
    settings: ['userPinFore'],
    watchsettings: ['settingsHead', 'settingsBody', '@glucNorm', 'glucLow', 'glucHigh', 'glucUnknown'],
    dialog: [
      'mainHeadBack', 'mainHeadFore', 'mainBodyBack', 'mainBodyFore',
      'dlgErrorHeadBack', 'dlgErrorHeadFore', 'dlgErrorBodyBack', 'dlgErrorBodyFore',
      'dlgWarnHeadBack', 'dlgWarnHeadFore', 'dlgWarnBodyBack', 'dlgWarnBodyFore'
    ]
  };
}
