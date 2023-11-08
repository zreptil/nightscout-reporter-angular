import {AfterViewChecked, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Observable, of} from 'rxjs';
import {DialogData, DialogParams, DialogResultButton, DialogType, IDialogButton} from '@/_model/dialog-data';
import {Utils} from '@/classes/utils';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit, AfterViewChecked {
  readData: any;
  mayFireValueChanges = false;
  chipsResult: string[] = [];

  constructor(public dialogRef: MatDialogRef<DialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

  get showTitleIcon(): boolean {
    return (this.data.params.icon != null || this.type != null) && !this.showTitleImage;
  };

  get showTitleImage(): boolean {
    return this.data.params.image != null;
  };

  get titleIcon(): string {
    if (this.data.params.icon != null) {
      return this.data.params.icon;
    }
    if (this.type != null) {
      return this.type;
    }
    return null;
  }

  get titleImage(): string {
    if (this.data.params.image != null) {
      return this.data.params.image;
    }
    return null;
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
    if (this.data.params.theme != null) {
      const id = `${this.data.params.theme}${key}`;
      ret.push(`--back:var(--${id}Back)`);
      ret.push(`--fore:var(--${id}Fore)`);
      ret.push(`background-color:var(--back)`);
      ret.push(`color:var(--fore)`);
    }
    return Utils.join(ret, ';');
  }

  update(data: string | string[]): void {
    this.data = new DialogData(this.data.type, data, new DialogParams());
  }

  ngOnInit(): void {
    const result = [];
    for (const chip of this.data?.chips ?? []) {
      if (chip.selected) {
        result.push(chip.title);
      }
    }
    this.chipsResult = result;
  }

  clickClose(): void {
    if (!this.dialogRef.disableClose) {
      this.dialogRef.close({
        btn: DialogResultButton.cancel
      });
    }
  }

  closeDialog(btn: IDialogButton): any {
    btn.result.data = this.readData;
    if (this.data.chips != null) {
      btn.result.data = {btn: this.readData, chips: this.chipsResult};
    }
    this.dialogRef.close(btn.result);
  }

  openUrl(btn: IDialogButton) {
    window.open(btn.url);
  }

  writeToBackend(): Observable<boolean> {
    return of(true);
  }

  ngAfterViewChecked(): void {
    this.mayFireValueChanges = true;
  }

  noImage(evt: ErrorEvent) {
    (evt.target as any).src = 'assets/img/empty.print.png';
  }
}
