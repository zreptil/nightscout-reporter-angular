import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {Utils} from '@/classes/utils';
import {DialogResultButton} from '@/_model/dialog-data';
import {SessionService} from '@/_services/session.service';
import {DataService} from '@/_services/data.service';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-shortcut-edit',
  templateUrl: './shortcut-edit.component.html',
  styleUrls: ['./shortcut-edit.component.scss']
})
export class ShortcutEditComponent implements OnInit {

  @Output('shortcuteditresult')
  trigger = new EventEmitter<UIEvent>();
  confirmationIdx = -1;

  constructor(public dialogRef: MatDialogRef<ShortcutEditComponent>,
              public ss: SessionService,
              public ds: DataService) {
  }

  get msgName(): string {
    return $localize`Bezeichnung`;
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get msgTitle(): string {
    return GLOBALS.currShortcutIdx < 0 ? $localize`Shortcut anlegen` : $localize`Shortcut ändern`;
  }

  /*
      void fire(String type) {
        var detail = 0;
        switch (type) {
          case 'ok':
            break;
          case 'confirm':
            switch (confirmationIdx) {
              case 0:
                type = 'remove';
                break;
              case 1:
                g.currShortcut.periodData = g.period.toString();
                g.currShortcut.periodText = g.period.display;
                confirmationIdx = -1;
                return;
              case 2:
                g.currShortcut.loadCurrentForms();
                confirmationIdx = -1;
                return;
              case 3:
                g.currShortcut.glucMGDLIdx = g.glucMGDLIdx;
                confirmationIdx = -1;
                return;
            }
        }
        _trigger.add(UIEvent(type, detail: detail));
      }
    }
    */
  get formsCount(): number {
    return Object.keys(GLOBALS.currShortcut.forms).length;
  }

  ngOnInit(): void {
  }

  msgFormsText(count: number): string {
    return Utils.plural(count, {
      0: $localize``,
      1: $localize`1 Formular`,
      other: $localize`${count} Formulare`
    });
  }

  clickDelete() {
    const msg1 = $localize`Soll der Shortcut mit der Bezeichnung`;
    const msg2 = `@${GLOBALS.currShortcut.name}@`;
    const msg3 = $localize`wirklich gelöscht werden?`;
    this.ss.confirm([msg1, msg2, msg3], 'shortcut').subscribe(result => {
      switch (result.btn) {
        case DialogResultButton.yes:
          if (GLOBALS.currShortcutIdx >= 0 && GLOBALS.currShortcutIdx < GLOBALS.shortcutList.length) {
            GLOBALS.shortcutList.splice(GLOBALS.currShortcutIdx, 1);
            GLOBALS.currShortcutIdx = null;
            GLOBALS.currShortcut = null;
            this.ds.saveShortcuts();
            this.dialogRef.close();
          }
          break;
      }
    });
  }

  clickSave() {
    this.ds.saveShortcuts();
    this.dialogRef.close();
  }

  clickZeitraum() {
    const msg1 = $localize`Soll der Zeitraum`;
    const msg2 = `@${GLOBALS.currShortcut.periodText}@`;
    const msg3 = $localize`mit dem Zeitraum`;
    const msg4 = `@${GLOBALS.period.display}@`;
    const msg5 = $localize`ersetzt werden?`;
    this.ss.confirm([msg1, msg2, msg3, msg4, msg5], 'shortcut').subscribe(result => {
      switch (result.btn) {
        case DialogResultButton.yes:
          GLOBALS.currShortcut.periodData = GLOBALS.period.toString();
          GLOBALS.currShortcut.periodText = GLOBALS.period.display;
          break;
      }
    });
  }

  clickForms() {
    const msg1 = $localize`Soll die Formularauswahl mit der aktuellen Auswahl ersetzt werden?`;
    this.ss.confirm(msg1, 'shortcut').subscribe(result => {
      switch (result.btn) {
        case DialogResultButton.yes:
          GLOBALS.currShortcut.loadCurrentForms();
          break;
      }
    });
  }

  clickGlucUnits() {
    const msg1 = $localize`Soll die Einheit zur Glukosemessung`;
    const msg2 = `@${GLOBALS.listGlucUnits[GLOBALS.currShortcut.glucMGDLIdx ?? 0]}@`;
    const msg3 = $localize`mit der Einheit`;
    const msg4 = `@${GLOBALS.listGlucUnits[GLOBALS.glucMGDLIdx]}@`;
    const msg5 = $localize`ersetzt werden?`;
    this.ss.confirm([msg1, msg2, msg3, msg4, msg5], 'shortcut').subscribe(result => {
      switch (result.btn) {
        case DialogResultButton.yes:
          GLOBALS.currShortcut.glucMGDLIdx = GLOBALS.glucMGDLIdx;
          break;
      }
    });
  }
}
