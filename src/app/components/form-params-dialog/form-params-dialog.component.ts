import {Component, Inject, OnInit} from '@angular/core';
import {SessionService} from '@/_services/session.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {BasePrint} from '@/forms/base-print';
import {ParamInfo} from '@/_model/param-info';
import {CloseButtonData} from '@/controls/close-button/close-button-data';

@Component({
  selector: 'app-form-params-dialog',
  templateUrl: './form-params-dialog.component.html',
  styleUrls: ['./form-params-dialog.component.scss'],
  standalone: false
})
export class FormParamsDialogComponent implements OnInit {
  closeData: CloseButtonData = {
    dialogClose: {btn: 2},
    colorKey: 'settings'
  };

  constructor(public ss: SessionService,
              @Inject(MAT_DIALOG_DATA) public form: BasePrint) {
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

  setAllParamsFor(value: boolean, params: ParamInfo[]): void {
    for (const param of params ?? []) {
      if (param.boolValue != null) {
        param.boolValue = value;
      }
      if (param.subParams != null) {
        this.setAllParamsFor(value, param.subParams);
      }
    }
  }
}
