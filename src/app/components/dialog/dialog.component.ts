import {AfterViewChecked, Component, Inject, OnInit} from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {Observable, of} from 'rxjs';
import {DialogData, DialogResultButton, DialogType, IDialogButton} from '@/_model/dialog-data';
import {Utils} from '@/classes/utils';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit, AfterViewChecked {
  readData: any;
  mayFireValueChanges = false;

  constructor(public dialogRef: MatDialogRef<DialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

  get type(): string {
    switch (this.data?.type) {
      case DialogType.warning:
        return 'warning';
      case DialogType.error:
        return 'error';
      case DialogType.info:
        return 'info';
      case DialogType.confirm:
      case DialogType.confirmNo:
        return 'help';
    }
    return null;
  }

  customStyle(key: string): string {
    const ret = [];
    if (this.data.theme != null) {
      ret.push(`background-color:var(--${this.data.theme}${key}Back)`);
      ret.push(`color:var(--${this.data.theme}${key}Fore)`);
    }
    return Utils.join(ret, ';');
  }

  update(data: string | string[]): void {
    this.data = new DialogData(this.data.type, data);
  }

  ngOnInit(): void {
  }

  clickClose(): void {
    this.dialogRef.close({
      btn: DialogResultButton.cancel
    });
  }

  closeDialog(btn: IDialogButton): any {
    btn.result.data = this.readData;
    this.dialogRef.close(btn.result);
  }

  writeToBackend(): Observable<boolean> {
    return of(true);
  }

  ngAfterViewChecked(): void {
    this.mayFireValueChanges = true;
  }
}
