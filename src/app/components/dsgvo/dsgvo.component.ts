import {Component, OnInit} from '@angular/core';
import {CloseButtonData} from '@/controls/close-button/close-button-data';

@Component({
  selector: 'app-dsgvo',
  templateUrl: './dsgvo.component.html',
  styleUrls: ['./dsgvo.component.scss']
})
export class DsgvoComponent implements OnInit {

  closeData: CloseButtonData = {
    color: 'legalHeadBack'
  };

  constructor() {
  }

  ngOnInit(): void {
  }

}
