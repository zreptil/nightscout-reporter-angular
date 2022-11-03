import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {SessionService} from '@/_services/session.service';
import {DataService} from '@/_services/data.service';
import {NightscoutService} from '@/_services/nightscout.service';

@Component({
  selector: 'app-view-list',
  templateUrl: './view-list.component.html',
  styleUrls: ['./view-list.component.scss']
})
export class ViewListComponent implements OnInit {
  constructor(public ss: SessionService,
              public ds: DataService,
              public ns: NightscoutService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  ngOnInit(): void {
  }

}
