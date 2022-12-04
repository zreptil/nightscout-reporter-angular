import {Component, Inject, OnInit} from '@angular/core';
import {SessionService} from '@/_services/session.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {BasePrint} from '@/forms/base-print';

@Component({
  selector: 'app-form-params-dialog',
  templateUrl: './form-params-dialog.component.html',
  styleUrls: ['./form-params-dialog.component.scss']
})
export class FormParamsDialogComponent implements OnInit {

  constructor(public ss: SessionService,
              @Inject(MAT_DIALOG_DATA) public form: BasePrint) {
  }

  _allParams = false;

  get allParams(): boolean {
    return this._allParams;
  }

  set allParams(value: boolean) {
    this._allParams = value;
    for (const param of this.form.params ?? []) {
      if (param.boolValue != null) {
        param.boolValue = value;
      }
    }
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  ngOnInit(): void {
  }

  clickSingleClose() {
    // extractAllParams();
    // tileParams = null;
    // evt.stopPropagation();
  }

  clickListToggle() {
    GLOBALS.showAllTileParams = !GLOBALS.showAllTileParams;
  }

  clickClose() {
    this.form.extractParams();
  }

  isFormVisible(form: BasePrint) {
    if (form.isDebugOnly && !GLOBALS.isDebug) {
      return false;
    }
    if (form.isLocalOnly && !GLOBALS.isLocal) {
      return false;
    }
    // noinspection RedundantIfStatementJS
    if (form.isBetaOrLocal && !(GLOBALS.isBeta || GLOBALS.isLocal)) {
      return false;
    }

    return true;
  }

  classForList(form: BasePrint, def?: string): string[] {
    const ret: string[] = def == null ? [] : [def];
    if (form.isDebugOnly) {
      ret.push('is-debug');
    }
    if (form.isLocalOnly) {
      ret.push('is-local');
    }
    return ret;
  }
}
