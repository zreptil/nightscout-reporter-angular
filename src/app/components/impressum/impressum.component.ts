import {Component, OnInit} from '@angular/core';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';

@Component({
  selector: 'app-impressum',
  templateUrl: './impressum.component.html',
  styleUrls: ['./impressum.component.scss'],
  standalone: false
})
export class ImpressumComponent implements OnInit {
  closeData: CloseButtonData = {
    colorKey: 'legal'
  };

  constructor() {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  ngOnInit(): void {
  }

}
