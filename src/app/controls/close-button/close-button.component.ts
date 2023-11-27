import {Component, Input} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {Utils} from '@/classes/utils';
import {CloseButtonData} from '@/controls/close-button/close-button-data';

@Component({
  selector: 'app-close-button',
  templateUrl: './close-button.component.html',
  styleUrls: ['./close-button.component.scss']
})
export class CloseButtonComponent {

  @Input()
  data: CloseButtonData = new CloseButtonData();

  get showColorCfg(): boolean {
    return GLOBALS.editColors && !Utils.isEmpty(this.data.colorKey);
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }
}
